import { ListItemChildWrapperElement } from "../types/Elements";
import { getChildItems } from "./getChildItems";

export function removeChildWrapperIfEmpty(childWrapper: ListItemChildWrapperElement): void {
  if (getChildItems(childWrapper) === null) {
    childWrapper.remove();
  }
}
