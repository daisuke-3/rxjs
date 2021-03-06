import { Observable } from '../Observable';
import { Operator } from '../Operator';
import { Observer } from '../Observer';
import { Subscriber } from '../Subscriber';

/**
 * Counts the number of emissions on the source and emits that number when the
 * source completes.
 *
 * <span class="informal">Tells how many values were emitted, when the source
 * completes.</span>
 *
 * <img src="./img/count.png" width="100%">
 *
 * `count` transforms an Observable that emits values into an Observable that
 * emits a single value that represents the number of values emitted by the
 * source Observable. If the source Observable terminates with an error, `count`
 * will pass this error notification along without emitting an value first. If
 * the source Observable does not terminate at all, `count` will neither emit
 * a value nor terminate. This operator takes an optional `predicate` function
 * as argument, in which case the output emission will represent the number of
 * source values that matched `true` with the `predicate`.
 *
 * @example <caption>Counts how many seconds have passed before the first click happened</caption>
 * var seconds = Rx.Observable.interval(1000);
 * var clicks = Rx.Observable.fromEvent(document, 'click');
 * var secondsBeforeClick = seconds.takeUntil(clicks);
 * var result = secondsBeforeClick.count();
 * result.subscribe(x => console.log(x));
 *
 * @example <caption>Counts how many odd numbers are there between 1 and 7</caption>
 * var numbers = Rx.Observable.range(1, 7);
 * var result = numbers.count(i => i % 2 === 1);
 * result.subscribe(x => console.log(x));
 *
 * @see {@link max}
 * @see {@link min}
 * @see {@link reduce}
 *
 * @param {function(value: T, i: number, source: Observable<T>): boolean} [predicate] A
 * boolean function to select what values are to be counted. It is provided with
 * arguments of:
 * - `value`: the value from the source Observable.
 * - `index`: the (zero-based) "index" of the value from the source Observable.
 * - `source`: the source Observable instance itself.
 * @return {Observable} An Observable of one number that represents the count as
 * described above.
 * @method count
 * @owner Observable
 */
export function count<T>(predicate?: (value: T, index: number, source: Observable<T>) => boolean): Observable<number> {
  return this.lift(new CountOperator(predicate, this));
}

export interface CountSignature<T> {
  (predicate?: (value: T, index: number, source: Observable<T>) => boolean): Observable<number>;
}

class CountOperator<T> implements Operator<T, number> {
  constructor(private predicate?: (value: T, index: number, source: Observable<T>) => boolean,
              private source?: Observable<T>) {
  }

  call(subscriber: Subscriber<number>, source: any): any {
    return source._subscribe(new CountSubscriber(subscriber, this.predicate, this.source));
  }
}

/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
class CountSubscriber<T> extends Subscriber<T> {
  private count: number = 0;
  private index: number = 0;

  constructor(destination: Observer<number>,
              private predicate?: (value: T, index: number, source: Observable<T>) => boolean,
              private source?: Observable<T>) {
    super(destination);
  }

  protected _next(value: T): void {
    if (this.predicate) {
      this._tryPredicate(value);
    } else {
      this.count++;
    }
  }

  private _tryPredicate(value: T) {
    let result: any;

    try {
      result = this.predicate(value, this.index++, this.source);
    } catch (err) {
      this.destination.error(err);
      return;
    }

    if (result) {
      this.count++;
    }
  }

  protected _complete(): void {
    this.destination.next(this.count);
    this.destination.complete();
  }
}
