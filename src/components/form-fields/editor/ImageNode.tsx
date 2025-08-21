import { 
  $applyNodeReplacement,
  DecoratorNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  LexicalNode,
  EditorConfig,
  LexicalEditor,
} from 'lexical';
import { Suspense } from 'react';

export interface ImagePayload {
  altText: string;
  caption?: string;
  height?: number;
  key?: NodeKey;
  maxWidth?: number;
  showCaption?: boolean;
  src: string;
  width?: number;
}

export type SerializedImageNode = Spread<
  {
    altText: string;
    caption?: string;
    height?: number;
    maxWidth?: number;
    showCaption?: boolean;
    src: string;
    width?: number;
  },
  SerializedLexicalNode
>;

function ImageComponent({
  src,
  altText,
  width,
  height,
  maxWidth,
  showCaption,
  caption,
}: {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  maxWidth?: number;
  showCaption?: boolean;
  caption?: string;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8 bg-gray-100 dark:bg-gray-800 rounded">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      }
    >
      <figure className="my-4">
        <img
          src={src}
          alt={altText}
          style={{
            height: height ? `${height}px` : 'auto',
            maxWidth: maxWidth ? `${maxWidth}px` : '100%',
            width: width ? `${width}px` : 'auto',
          }}
          className="rounded-lg shadow-md mx-auto"
          draggable="false"
        />
        {showCaption && caption && (
          <figcaption className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
            {caption}
          </figcaption>
        )}
      </figure>
    </Suspense>
  );
}

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width?: number;
  __height?: number;
  __maxWidth?: number;
  __showCaption?: boolean;
  __caption?: string;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__maxWidth,
      node.__showCaption,
      node.__caption,
      node.__key,
    );
  }

  constructor(
    src: string,
    altText: string,
    width?: number,
    height?: number,
    maxWidth?: number,
    showCaption?: boolean,
    caption?: string,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
    this.__maxWidth = maxWidth;
    this.__showCaption = showCaption;
    this.__caption = caption;
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.getAltText(),
      caption: this.__caption,
      height: this.__height,
      maxWidth: this.__maxWidth,
      showCaption: this.__showCaption,
      src: this.getSrc(),
      type: 'image',
      version: 1,
      width: this.__width,
    };
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, caption, height, maxWidth, showCaption, src, width } = serializedNode;
    const node = $createImageNode({
      altText,
      caption,
      height,
      maxWidth,
      showCaption,
      src,
      width,
    });
    return node;
  }

  setWidthAndHeight(width?: number, height?: number): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const className = config.theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        maxWidth={this.__maxWidth}
        showCaption={this.__showCaption}
        caption={this.__caption}
      />
    );
  }
}

export function $createImageNode({
  altText,
  caption,
  height,
  maxWidth = 800,
  showCaption,
  src,
  width,
  key,
}: ImagePayload): ImageNode {
  return $applyNodeReplacement(
    new ImageNode(src, altText, width, height, maxWidth, showCaption, caption, key),
  );
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode;
}