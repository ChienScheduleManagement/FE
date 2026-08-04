import type { ZodString, ZodType } from 'zod'

declare module 'zod' {
  interface ZodNumber {
    stringFormat(format: string, regex: RegExp): ZodType
  }

  interface ZodString {
    stringFormat(format: string, regex: RegExp): ZodType
  }

  function stringFormat(format: string, regex: RegExp): ZodString
}