import { rpcErrors } from '@metamask/rpc-errors';
import type {
  OnRpcRequestHandler,
  OnUserInputHandler,
  OnTransactionHandler
} from '@metamask/snaps-sdk';
import { divider, SnapMethods } from '@metamask/snaps-sdk';
import { UserInputEventType, DialogType, image } from '@metamask/snaps-sdk';
import { assert } from '@metamask/utils';

import { Counter } from './components';
import { getCurrent, increment } from './utils';
import { panel, text, button } from '@metamask/snaps-sdk';

import { Image } from '@metamask/snaps-sdk/jsx';

import svgIcon from "./vitalik-traffic.jpeg";

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

      return await snap.request({
        method: 'snap_dialog',
        params: {
          type: DialogType.Alert,
          // content: <Image src='https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png />,
          content: panel([
            image(svgIcon),
            text(`Current block: **${currentBlock}**`),
            text(`Interactions: **${interactionsCount}**`),
            text(`Upvotes: ...`),
            text(`Downvotes: ...`),
            divider(),
            text("After interacting with the contract, please provide feedback. You vote will only count if you interacted with a contract in the last 24 hours."),
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
  const count = 1;

  const interactionsCount = 100;

  return await snap.request({
    method: 'snap_dialog',
    params: {
      type: "alert",
      content: panel([
        text(`Hello, **${transactionOrigin}**!`),
        text(`Interactions in the last 24h: **${interactionsCount}**`)
      ]),
    },
  });
}

// /**
//  * Handle incoming user events coming from the Snap interface. This handler
//  * handles one event:
//  *
//  * - `increment`: Increment the counter and update the Snap interface with the
//  * new count. It is triggered when the user clicks the increment button.
//  *
//  * @param params - The event parameters.
//  * @param params.id - The Snap interface ID where the event was fired.
//  * @param params.event - The event object containing the event type, name and
//  * value.
//  * @see https://docs.metamask.io/snaps/reference/exports/#onuserinput
//  */
// export const onUserInput: OnUserInputHandler = async ({ event, id }) => {
//   // Since this Snap only has one event, we can assert the event type and name
//   // directly.
//   assert(event.type === UserInputEventType.ButtonClickEvent);
//   assert(event.name === 'increment');

//   const count = await increment();

//   await snap.request({
//     method: 'snap_updateInterface',
//     params: {
//       id,
//       ui: <Counter count={count} />,
//     },
//   });
// };
