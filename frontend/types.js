
type DOMNode = {
  nodeName: string,
  style: Object,
  offsetTop: number,
  offsetLeft: number,
  offsetHeight: number,
  offsetWidth: number,
  offsetParent: ?DOMNode,
  onclick?: (evt: DOMEvent) => void,
  scrollLeft: number,
  scrollTop: number,
  appendChild: (child: DOMNode) => void,
  removeChild: (child: DOMNode) => void,
  parentNode: DOMNode,
  innerText: string,
};

type DOMEvent = {
  target: DOMNode,
  preventDefault: () => void,
  stopPropagation: () => void,
  cancelBubble: boolean,
};

export {DOMNode, DOMEvent};

