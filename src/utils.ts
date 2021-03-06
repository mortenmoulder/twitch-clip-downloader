import * as fns                                         from "date-fns";
import {differenceInHours, differenceInMinutes, format} from "date-fns";

const SPLIT_FACTOR = 2;

export type Period = {
    left: Date,
    right: Date,
}

export function debug(...messages: any[]) {
    if (process.env.DEBUG === 'true') {
        console.log(...messages);
    }
}

export function splitPeriod(period: Period): Period[] {
    // left/right is reversed so we get a positive number
    const diffInMinutes = differenceInMinutes(period.right, period.left);
    const ceil = Math.ceil(diffInMinutes / SPLIT_FACTOR);

    if (diffInMinutes === ceil) {
        throw Error(`Reached 1 minute periods, something is probably wrong.`);
    }

    debug(`Splitting period of ${diffInMinutes}min in ${ceil}min increments`);
    return generateBatchesFrom(period.left, period.right, ceil);
}

export function generateBatches(): Period[] {
    // The day Twitch Clips were announced
    const left = new Date(2016, 4, 26);
    const right = fns.endOfToday();

    return generateBatchesFrom(left, right, 30*24*60);
}

export function generateBatchesFrom(left: Date, right: Date, minutesIncrements: number): Period[] {
    const batches: Period[] = [];

    while (fns.compareAsc(right, left) >= 0) {
        const next = fns.addMinutes(left, minutesIncrements);
        batches.push({left: left, right: next});
        left = next;
    }
    console.log(batches);
    return batches;
}

export function apiDelay(remaining: number, total: number, resetTime: number) {
    // How fast the delay grows
    const degree = 3;
    // Delay starts when remaining requests is below 10% the total rate-limit
    const startsAt = total * 0.1;

    if (startsAt < remaining) return 0;

    const factor = 1 - Math.pow(remaining / startsAt, degree);

    return resetTime * factor;
}

export function pathableDate(date: Date) {
    return format(date, 'yyyy-LL-dd_hh-mm-ss')
}

export function sleep(delay: number) {
    return new Promise(resolve => {
        setTimeout(resolve, delay);
    });
}

// https://stackoverflow.com/questions/18884249/checking-whether-something-is-iterable
export function iterable(obj: any) {
    // checks for null and undefined
    if (obj == null) {
        return false;
    }

    return typeof obj[Symbol.iterator] === 'function';
}
