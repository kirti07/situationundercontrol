import { InputKind, type State } from '@suc/sim';
import { CHANNEL, PLACARDS } from '../../content/moments.ts';
import { h } from '../../dom.ts';
import { queueInput, type Session } from '../session.ts';
import { countdown, optionButton, type MomentView } from './view.ts';

export const placardView =
  (session: Session) =>
  (state: State): MomentView => {
    const timer = countdown();
    const placard = PLACARDS[state.moment.cards[0] ?? 0];
    const right = state.moment.cards[1] ?? 0;
    const sides = [0, 1].map((side) => (side === right ? placard?.right : placard?.wrong) ?? '');
    return {
      element: h('div', { className: 'moment moment--duel' }, [
        h('p', { className: 'moment__ticker' }, [
          h('span', { className: 'moment__channel', text: CHANNEL }),
          h('span', { className: 'moment__headline', text: placard?.headline ?? '' }),
        ]),
        h('section', { className: 'moment moment--panel' }, [
          h('h2', { className: 'moment__title', text: 'Raise the right placard' }),
          h(
            'div',
            { className: 'moment__options moment__options--placards' },
            sides.map((text, side) =>
              optionButton(side, text, () => {
                queueInput(session, InputKind.Answer, 0, side, 0);
              }),
            ),
          ),
          timer.element,
        ]),
      ]),
      update: timer.update,
    };
  };
