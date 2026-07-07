declare module "react-syntax-highlighter" {
  import { ComponentType } from "react"
  export const Prism: ComponentType<any>
  export const Light: ComponentType<any>
  export default ComponentType<any>
}

declare module "react-syntax-highlighter/dist/cjs/styles/prism" {
  export const oneDark: any
  export const oneLight: any
  export const vs: any
  export const vscDarkPlus: any
}

declare module "react-syntax-highlighter/dist/esm/styles/prism" {
  export const oneDark: any
  export const oneLight: any
  export const vs: any
  export const vscDarkPlus: any
}
