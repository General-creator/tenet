/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
declare module '*.svg' {
  import * as React from 'react'

  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>
  const src: string
  export default src
}
