import type {MessageBox} from "../../../client/types/index.js";

interface MessageRef {
  box: MessageBox;
  id: string;
  /** From the list - shown while the details load */
  topic: string;
}

export type {MessageRef};
