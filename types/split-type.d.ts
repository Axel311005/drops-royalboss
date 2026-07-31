declare module "split-type" {
  export type SplitTypeOptions = {
    types?: string | string[];
    tagName?: string;
  };

  export default class SplitType {
    chars: HTMLElement[] | null;
    words: HTMLElement[] | null;
    lines: HTMLElement[] | null;
    constructor(target: HTMLElement | string, options?: SplitTypeOptions);
    revert(): void;
  }
}
