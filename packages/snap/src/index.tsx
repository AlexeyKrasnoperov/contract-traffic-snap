import { rpcErrors } from '@metamask/rpc-errors';
import type {
  OnRpcRequestHandler,
  OnUserInputHandler,
  OnTransactionHandler
} from '@metamask/snaps-sdk';
import { UserInputEventType, DialogType } from '@metamask/snaps-sdk';
import { assert } from '@metamask/utils';

import { panel, divider, text, button, image } from '@metamask/snaps-sdk';

import happyHigh from "../images/happy-high.png";
import happyMedium from "../images/happy-medium.png";
import happyLow from "../images/happy-low.png";
import unhappyHigh from "../images/unhappy-high.png";
import unhappyMedium from "../images/unhappy-medium.png";
import unhappyLow from "../images/unhappy-low.png";

/**
 * Handle incoming JSON-RPC requests from the dapp, sent through the
 * `wallet_invokeSnap` method. This handler handles one method:
 *
 * - `display`: Display a dialog with a counter, and a button to increment the
 * counter. This demonstrates how to display a dialog with JSX content, and how
 * to handle user input events.
 *
 * @param params - The request parameters.
 * @param params.request - The JSON-RPC request object.
 * @returns The JSON-RPC response.
 * @see https://docs.metamask.io/snaps/reference/exports/#onrpcrequest
 */
export const onRpcRequest: OnRpcRequestHandler = async ({ request }) => {
  switch (request.method) {
    case 'hello': {
      const contractAddress = "0x1195Cf65f83B3A5768F3C496D3A05AD6412c64B7";

      const blocksInHour = 1800;
      const currentBlock = Number(await ethereum.request({
        method: "eth_blockNumber",
      }) as number);
      const apiURL = `https://explorer.linea.build/api?module=account&action=txlist&address=${contractAddress}&startblock=${currentBlock - blocksInHour}&endblock=${currentBlock}&sort=desc&offset=100&page=0`

      const response = await fetch(apiURL);
      const data = await response.json();
      const interactionsCount = data["result"].length;

      switch (true) {
        case interactionsCount > 80:
          var svgIcon = happyHigh;
          break;
        case interactionsCount > 30:
          var svgIcon = happyMedium;
          break;
        default:
          var svgIcon = happyLow;
      }

      return await snap.request({
        method: 'snap_dialog',
        params: {
          type: DialogType.Alert,
          content: panel([
            image(svgIcon),
            text(`Current block: **${currentBlock}**`),
            text(`Popularity: **${interactionsCount}**`),
            text(`Upvotes: ...`),
            text(`Downvotes: ...`),
            divider(),
            text("After interacting with the contract, please provide feedback. Your vote will only count if you interacted with the contract in the last 24 hours."),
            button({
              value: "I'm happy",
              name: "interactive-button",
            }),
            button({
              value: "I'm NOT happy",
              name: "interactive-button",
              variant: "secondary",
            }),
          ]),
        },
      });
    }

    default:
      throw rpcErrors.methodNotFound({
        data: {
          method: request.method,
        },
      });
  }
};

export const onTransaction: OnTransactionHandler = async ({
  transactionOrigin,
  chainId,
  transaction,
}) => {
  const contractAddress = transaction.to;

  const blocksInHour = 1800;
  const currentBlock = Number(await ethereum.request({
    method: "eth_blockNumber",
  }) as number);
  const apiURL = `https://explorer.linea.build/api?module=account&action=txlist&address=${contractAddress}&startblock=${currentBlock - blocksInHour}&endblock=${currentBlock}&sort=desc&offset=100&page=0`

  const response = await fetch(apiURL);
  const data = await response.json();
  const interactionsCount = data["result"].length;

  const svgIcon = happyHigh;


  return {
      type: "alert",
      content: panel([
        image(svgIcon),
        text(`Current block: **${currentBlock}**`),
        text(`Popularity: **${interactionsCount}**`),
        text(`Happy users: ...`),
        text(`Unhappy users: ...`),
        divider(),
        text("After interacting with the contract, please provide feedback. Your vote will only count if you interacted with the contract in the last 24 hours."),
        button({
          value: "I'm happy",
          name: "interactive-button",
        }),
        button({
          value: "I'm NOT happy",
          name: "interactive-button",
          variant: "secondary",
        }),
      ]),
    };
}

/**
 * Handle incoming user events coming from the Snap interface. This handler
 * handles one event:
 *
 * - `increment`: Increment the counter and update the Snap interface with the
 * new count. It is triggered when the user clicks the increment button.
 *
 * @param params - The event parameters.
 * @param params.id - The Snap interface ID where the event was fired.
 * @param params.event - The event object containing the event type, name and
 * value.
 * @see https://docs.metamask.io/snaps/reference/exports/#onuserinput
 */
// export const onUserInput: OnUserInputHandler = async ({ event, id }) => {
//   // Since this Snap only has one event, we can assert the event type and name
//   // directly.
//   assert(event.type === UserInputEventType.ButtonClickEvent);
//   assert(event.name === 'increment');

//   const count = await console.log("CLICKED");

//   await snap.request({
//     method: 'snap_updateInterface',
//     params: {
//       id,
//       ui:  panel([
//         text("CLICKED")
//       ]),
//     },
//   });
// };
