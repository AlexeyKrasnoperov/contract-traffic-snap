// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract SafeCity is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    error UnexpectedRequestID(bytes32 requestId);

    string source =
        "const contractAddress = args[0];"
        "const userAddress = args[1];"
        "const currentBlock = args[2];"
        "const startBlock = currentBlock - 1800;"
        "const url = `https://eth-sepolia.blockscout.com/api?module=account&action=txlist&address=${contractAddress}&startblock=${startBlock}&endblock=${currentBlock}&sort=desc&offset=100&page=0&filterBy=to`"
        "const apiRequest = Functions.makeHttpRequest({"
        "url: url"
        "});"
        "const apiResponse = await apiRequest;"
        "if (apiResponse.error) {"
        "throw Error('Request failed');"
        "}"
        "const data = apiResponse.data;"
        "const result = data.result.some(entity => entity.from === userAddress);"
        "return Functions.encodeUint256(result == true ? 1 : 0);";

    //Callback gas limit
    uint32 gasLimit = 300000;

    bytes32 donID;
    uint64 subscriptionID;

    struct Review {
        address reviewer;
        bool happy;
        string review;
    }

    struct ReviewCount {
        uint256 happy;
        uint256 sad;
    }

    // Review[] public reviews;
    mapping(address reviewedAddress => Review[]) private reviews;
    mapping(address reviewedAddress => ReviewCount) private review_count;

    struct FunctionRequestMetadata {
        address reviewer;
        address reviewedAddress;
        bool happy;
        string review;
    }

    mapping(bytes32 => FunctionRequestMetadata) private functionRequestMetadata;

    event NewReview(address reviewedAddress, address reviewer, bool happy, string review, bytes error);

    /**
     * @notice Initializes the contract with the Chainlink router address and sets the contract owner
     */
    constructor(
        address router,
        bytes32 _donID,
        uint64 _subscriptionID
    ) FunctionsClient(router) ConfirmedOwner(msg.sender) {
        donID = _donID;
        subscriptionID = _subscriptionID;
    }

    function reportHappiness(address _reviewedAddress, bool happy, string memory review) public {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        string[] memory args = new string[](3);
        args[0] = toAsciiString(_reviewedAddress);
        args[1] = toAsciiString(msg.sender);
        args[2] = Strings.toString(block.number);
        req.setArgs(args);

        // Send the request and store the request ID
        bytes32 requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionID,
            gasLimit,
            donID
        );
        
        functionRequestMetadata[requestId] = FunctionRequestMetadata(
            msg.sender,
            _reviewedAddress,
            happy,
            review
        );
    }

    function getRecentReviews(address _reviewedAddress) public view returns (Review[] memory) {
        return reviews[_reviewedAddress];
    }

    function getReviewCount(address _reviewedAddress) public view returns (uint256, uint256) {
        return (review_count[_reviewedAddress].happy, review_count[_reviewedAddress].sad);
    }

    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);            
        }
        return string(s);
    }

    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }

    /**
     * @notice Callback function for fulfilling a request
     * @param requestId The ID of the request to fulfill
     * @param response The HTTP response data
     * @param err Any errors from the Functions request
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (bytes(functionRequestMetadata[requestId].review).length == 0) {
            revert UnexpectedRequestID(requestId);
        }

        address _reviewer = functionRequestMetadata[requestId].reviewer;
        address _reviewedAddress = functionRequestMetadata[requestId].reviewedAddress;
        bool _happy = functionRequestMetadata[requestId].happy;
        string memory _review = functionRequestMetadata[requestId].review;

        if (abi.decode(response, (uint256)) == 1) {
            Review memory newReview = Review(_reviewer, _happy, _review);
            reviews[_reviewedAddress].push(newReview);
            if (_happy) {
                review_count[_reviewedAddress].happy++;
            } else {
                review_count[_reviewedAddress].sad++;
            }
        }

        emit NewReview(_reviewedAddress, _reviewer, _happy, _review, err);
    }
}