declare module "jalaali-js" {
  export function isValidJalaaliDate(jy: number, jm: number, jd: number): boolean
  export function toGregorian(
    jy: number,
    jm: number,
    jd: number,
  ): { gy: number; gm: number; gd: number }
  export function toJalaali(date: Date): { jy: number; jm: number; jd: number }
}
