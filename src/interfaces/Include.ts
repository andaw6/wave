export interface Include {
    [key: string]: boolean | string | {
        [key: string]: Include
    }
}