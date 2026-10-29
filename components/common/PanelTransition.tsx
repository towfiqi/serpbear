import React, { cloneElement, useRef } from 'react';
import { CSSTransition } from 'react-transition-group';

type PanelTransitionProps = {
   in: boolean,
   classNames: string,
   children: React.ReactElement<{ ref?: React.Ref<HTMLDivElement> }>,
}

/**
 * CSSTransition with its own nodeRef. Without one, CSSTransition falls back to
 * findDOMNode, which React 19 removed: every modal and side panel would throw
 * on open. The child passes `ref` on to the element that carries the animation
 * classes — its root, as findDOMNode used to pick.
 */
const PanelTransition = ({ in: show, classNames, children }: PanelTransitionProps) => {
   const nodeRef = useRef<HTMLDivElement>(null);
   return (
      <CSSTransition in={show} nodeRef={nodeRef} timeout={300} classNames={classNames} unmountOnExit mountOnEnter>
         {cloneElement(children, { ref: nodeRef })}
      </CSSTransition>
   );
};

export default PanelTransition;
