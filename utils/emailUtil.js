export class EmailUtils {
    static generateEmail(){
        return `noreply-dev+${new Date().getTime()}@meedl.africa`
    }

    static #generateNumberWithDigits(digits){
        if (digits <= 0 || !Number.isInteger(digits)){
            digits = 1;
        }
        let result = '';
        for (let i = 0; i < digits; i++){
            result += Math.floor(Math.random() * 10);
        }
        return result;
    }

    static generateRcNumber(length = 7){
        return `RC${this.#generateNumberWithDigits(length)}`;
    }

    static generateTaxNumber(length = 11){
        return this.#generateNumberWithDigits(length);
    }

    static generateRandomString(length = 5, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'){
        return Array.from({length: length}, () =>
            charset.charAt(Math.floor(Math.random() * charset.length))
        ).join('');
    }
}