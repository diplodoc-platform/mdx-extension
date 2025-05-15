import { runSync } from "@mdx-js/mdx";
import { type Root, createRoot, hydrateRoot } from "react-dom/client";
import * as runtime from "react/jsx-runtime";
import React from "react";
import type { MDXComponents, MDXProps } from "mdx/types";

const nodeRootMap = new WeakMap<Element, Root>();
const nodeWillUmount = new WeakMap<Element, boolean>();

interface RenderMdxComponentsProps {
  ctr: HTMLElement;
  isSSR?: boolean;
  components?: MDXComponents;
  idMdxComponent: Record<string, React.ComponentType<MDXProps>>;
}

export const renderMdxComponents = ({
  idMdxComponent,
  isSSR,
  ctr,
  components,
}: RenderMdxComponentsProps) => {
  const unmountFns = Object.entries(idMdxComponent).map(([id, Content]) => {
    let node = ctr.querySelector(`.${id}`);
    if (!node) {
      throw new Error("node is null");
    }

    if (nodeWillUmount.get(node) && node.parentNode) {
      const newNode = node.cloneNode(true) as Element;
      node.parentNode.replaceChild(newNode, node);
      node = newNode;
    }

    const reactNode = React.createElement(Content, {
      components,
    });

    let root = nodeRootMap.get(node);
    if (root) {
      root.render(reactNode);
    } else {
      const options = {
        identifierPrefix: id,
      };
      if (isSSR) {
        root = hydrateRoot(node, reactNode, options);
      } else {
        root = createRoot(node, options);
        root.render(reactNode);
      }
      nodeRootMap.set(node, root);
    }

    return () => {
      nodeWillUmount.set(node, true);
      setTimeout(() => root.unmount(), 0);
    };
  });

  return () => unmountFns.forEach((cb) => cb());
};

export const idMdxToComponents = (idMdx?: Record<string, string>) => {
  return Object.entries(idMdx ?? {}).reduce<
    Record<string, React.ComponentType<MDXProps>>
  >((acc, [id, fnStr]) => {
    // eslint-disable-next-line no-param-reassign
    acc[id] = runSync(fnStr, runtime).default;
    return acc;
  }, {});
};
