export type TenetId = string & { readonly __brand: unique symbol }

export interface TenetEntity {
  id: TenetId
  name: string
  createdAt: Date
  updatedAt: Date
}
