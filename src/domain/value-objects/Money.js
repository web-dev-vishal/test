/**
 * Global-Fi Ultra - Money Value Object
 * 
 * Big.js wrapper for precision financial calculations.
 * All monetary values MUST use this class to avoid floating-point errors.
 */

import Big from 'big.js';

// Configure Big.js global settings
Big.DP = 8;  // Decimal places
Big.RM = 1;  // Round half-up

/**
 * Money value object for precise financial calculations
 */
export class Money {
    /**
     * @param {string|number|Big} value - Initial value
     * @throws {Error} If value is not a valid number
     */
    constructor(value) {
        try {
            this._value = new Big(value);
        } catch (error) {
            throw new Error(`Invalid monetary value: ${value}`);
        }
    }

    /**
     * Create Money from a value
     * @param {string|number|Big} value
     * @returns {Money}
     */
    static of(value) {
        return new Money(value);
    }

    /**
     * Create Money with zero value
     * @returns {Money}
     */
    static zero() {
        return new Money(0);
    }

    /**
     * Add another Money value
     * @param {Money|string|number} other
     * @returns {Money}
     */
    plus(other) {
        const otherValue = other instanceof Money ? other._value : new Big(other);
        return new Money(this._value.plus(otherValue));
    }

    /**
     * Subtract another Money value
     * @param {Money|string|number} other
     * @returns {Money}
     */
    minus(other) {
        const otherValue = other instanceof Money ? other._value : new Big(other);
        return new Money(this._value.minus(otherValue));
    }

    /**
     * Multiply by a value
     * @param {Money|string|number} multiplier
     * @returns {Money}
     */
    times(multiplier) {
        const m = multiplier instanceof Money ? multiplier._value : new Big(multiplier);
        return new Money(this._value.times(m));
    }

    /**
     * Divide by a value
     * @param {Money|string|number} divisor
     * @returns {Money}
     */
    div(divisor) {
        const d = divisor instanceof Money ? divisor._value : new Big(divisor);
        return new Money(this._value.div(d));
    }

    /**
     * Check if greater than another value
     * @param {Money|string|number} other
     * @returns {boolean}
     */
    gt(other) {
        const otherValue = other instanceof Money ? other._value : new Big(other);
        return this._value.gt(otherValue);
    }

    /**
     * Check if less than another value
     * @param {Money|string|number} other
     * @returns {boolean}
     */
    lt(other) {
        const otherValue = other instanceof Money ? other._value : new Big(other);
        return this._value.lt(otherValue);
    }

    /**
     * Check if equal to another value
     * @param {Money|string|number} other
     * @returns {boolean}
     */
    eq(other) {
        const otherValue = other instanceof Money ? other._value : new Big(other);
        return this._value.eq(otherValue);
    }

    /**
     * Get absolute value
     * @returns {Money}
     */
    abs() {
        return new Money(this._value.abs());
    }

    /**
     * Round to specified decimal places
     * @param {number} [dp=2] - Decimal places
     * @returns {Money}
     */
    round(dp = 2) {
        return new Money(this._value.round(dp));
    }

    /**
     * Convert to string (primary output format)
     * @returns {string}
     */
    toString() {
        return this._value.toString();
    }

    /**
     * Convert to fixed decimal string
     * @param {number} [dp=2] - Decimal places
     * @returns {string}
     */
    toFixed(dp = 2) {
        return this._value.toFixed(dp);
    }

    /**
     * Convert to number (use with caution!)
     * @returns {number}
     */
    toNumber() {
        return this._value.toNumber();
    }

    /**
     * Get raw Big.js value
     * @returns {Big}
     */
    toBig() {
        return this._value;
    }
}

export default Money;
