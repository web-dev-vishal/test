/**
 * Global-Fi Ultra - Percentage Value Object
 * 
 * Big.js wrapper for percentage calculations with precision.
 */

import Big from 'big.js';

/**
 * Percentage value object for precise calculations
 */
export class Percentage {
    /**
     * @param {string|number|Big} value - Percentage value (e.g., 5.25 for 5.25%)
     */
    constructor(value) {
        try {
            this._value = new Big(value);
        } catch (error) {
            throw new Error(`Invalid percentage value: ${value}`);
        }
    }

    /**
     * Create Percentage from a value
     * @param {string|number} value
     * @returns {Percentage}
     */
    static of(value) {
        return new Percentage(value);
    }

    /**
     * Create Percentage from a decimal (0.0525 → 5.25%)
     * @param {string|number} decimal
     * @returns {Percentage}
     */
    static fromDecimal(decimal) {
        return new Percentage(new Big(decimal).times(100));
    }

    /**
     * Calculate percentage of an amount
     * @param {string|number|Big} amount
     * @returns {Big}
     */
    of(amount) {
        const a = new Big(amount);
        return a.times(this._value).div(100);
    }

    /**
     * Add another percentage
     * @param {Percentage|string|number} other
     * @returns {Percentage}
     */
    plus(other) {
        const otherValue = other instanceof Percentage ? other._value : new Big(other);
        return new Percentage(this._value.plus(otherValue));
    }

    /**
     * Subtract another percentage
     * @param {Percentage|string|number} other
     * @returns {Percentage}
     */
    minus(other) {
        const otherValue = other instanceof Percentage ? other._value : new Big(other);
        return new Percentage(this._value.minus(otherValue));
    }

    /**
     * Convert to decimal (5.25% → 0.0525)
     * @returns {string}
     */
    toDecimal() {
        return this._value.div(100).toString();
    }

    /**
     * Convert to string (e.g., "5.25")
     * @returns {string}
     */
    toString() {
        return this._value.toString();
    }

    /**
     * Convert to formatted string (e.g., "5.25%")
     * @param {number} [dp=2] - Decimal places
     * @returns {string}
     */
    toFormatted(dp = 2) {
        return `${this._value.toFixed(dp)}%`;
    }
}

export default Percentage;
