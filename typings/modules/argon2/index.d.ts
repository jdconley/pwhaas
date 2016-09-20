declare module "argon2" {
    namespace argon2 {
        interface IOptions {
            hashLength:number;
            timeCost:number;
            memoryCost:number;
            parallelism:number;
            argon2d:boolean;
        }

        interface INumericLimit {
            max:number;
            min:number;
        }

        interface IOptionLimits {
            hashLength:INumericLimit;
            memoryCost:INumericLimit;
            timeCost:INumericLimit;
            parallelism:INumericLimit;
        }

        const defaults:IOptions;
        const limits:IOptionLimits;
        function hash(plain:string, salt:Buffer|string, options?:IOptions):Promise<string>;
        function generateSalt(length:number):Promise<Buffer>;
        function verify(hash:string, plain:string):Promise<boolean>;
    }

    export = argon2;
}