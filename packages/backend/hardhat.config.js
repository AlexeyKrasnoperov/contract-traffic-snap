require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config()

module.exports = {
	solidity: {
		version: "0.8.24",
		settings: {
			optimizer: {
				enabled: true
			}
		}
	},
	sourcify: {
		enabled: false,
	},
	allowUnlimitedContractSize: true,
	networks: {
		hardhat: {},
		sepolia: {
			accounts: [`${process.env.PRIVATE_KEY}`],
			url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
		},
		LINEA_SEPOLIA: {
			accounts: [`${process.env.PRIVATE_KEY}`],
			url: `https://linea-sepolia.infura.io/v3/125091ee1d1740468c038288fd3c6f78`,
		}
	},
	etherscan: {
		apiKey: `${process.env.ETHERSCAN_API_KEY}`,
	},
}
