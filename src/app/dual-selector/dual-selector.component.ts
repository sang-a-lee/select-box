/**
 * 1. 검색 및 선택
 * 2. 초기화 (add, remove .. 버튼 아래에)
 * 3. 아이템 순서 이동 (✔️)
 * 4. interface -> class
 * 5. selected 된 상태는 available이나 selected나 한쪽만 유지 (✔️)
 * 6. 컴포넌트 외부에서 데이터를 주입하기 전에, 컴포넌트에 맞는 타입으로 변형시켜서 넣는다고 생각
 * 그리고 선택이 안되었을 때는 동작하는 버튼들을 모두 disabled 처리
 * 7. 원본이 변경되지 않도록
 */

import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  SimpleChange,
} from '@angular/core';

interface Item {
  id: number;
  name: string;
  ordinal: number;
  visible: boolean;
  focused: boolean;
}

enum MenuState {
  available,
  selected,
  none,
}

const reducer = (acc, curr) => {
  acc.push(curr.id);
  return acc;
};

@Component({
  selector: 'app-dual-selector',
  templateUrl: './dual-selector.component.html',
  styleUrls: ['./dual-selector.component.less'],
})
export class DualSelectorComponent implements OnInit {
  @Input() data: Item[];
  @Output() clickEventAction = new EventEmitter();
  @Output() clickEventReset = new EventEmitter();

  available: Item[] = [];
  selected: Item[] = [];
  focused: number[] = [];
  menuState = MenuState.none;

  constructor() {}

  setMenuState(state: MenuState): void {
    this.menuState = state;
  }
  _clearMenuState(): void {
    this.menuState = MenuState.none;
  }

  _toggleFocus(list: Item[], id: number): void {
    list.map(item => (item.id === id ? (item.focused = !item.focused) : item));
  }

  _initOrdinal(list: Item[]): void {
    for (let i = 0; i < list.length; i++) {
      list[i].ordinal = i;
    }
  }

  _clearFocused(list: Item[]): void {
    list.map(item => (item.focused = false));
  }

  _swap(list: Item[], idx1: number, idx2: number): void {
    [list[idx1], list[idx2]] = [list[idx2], list[idx1]];
    list[idx1].ordinal = idx1;
    list[idx2].ordinal = idx2;
  }

  _sendClickEvent() {
    this.clickEventAction.emit({
      selected: this.selected.reduce(reducer, []),
      available: this.available.reduce(reducer, []),
    });
  }

  onSelect(state: string, item: Item): void {
    if (
      this.menuState !== MenuState.none &&
      MenuState[state] !== this.menuState
    ) {
      // 선택 불가능
      return;
    }

    const { id } = item;
    switch (state) {
      case 'available':
        this._toggleFocus(this.available, id);
        if (!this.focused.includes(id)) {
          this.focused.push(id);
        } else {
          this.focused = this.focused.filter(focusId => focusId !== id);
        }
        // this.available.map(item =>
        //   item.id === id ? (item.focused = !item.focused) : item
        // );
        break;

      case 'selected':
        this._toggleFocus(this.selected, id);
        if (!this.focused.includes(id)) {
          this.focused.push(id);
        } else {
          this.focused = this.focused.filter(focusId => focusId !== id);
        }
        // this.selected.map(item =>
        //   item.id === id ? (item.focused = !item.focused) : item
        // );
        break;
    }

    this.setMenuState(MenuState[state]);
    if (this.focused.length === 0) {
      this.setMenuState(MenuState.none);
    }
  }

  /* available -> selected (오른쪽으로) */
  toSelectedAll(): void {
    // 모든 아이템을 selected로 옮깁니다
    this.selected = [...this.selected, ...this.available];
    this.available = [];
    //
    this._initOrdinal(this.available);
    this._initOrdinal(this.selected);
    this._clearMenuState();
    this.focused = [];

    this._sendClickEvent();
  }

  toSelected(): void {
    // 선택된 아이템을 selected로 옮깁니다

    const focusedItems = this.available.filter(item => item.focused === true);
    const focusedIds = focusedItems.reduce(reducer, []);
    this._clearFocused(focusedItems);
    this.selected = [...this.selected, ...focusedItems];

    this.available = this.available.filter(
      ({ id }) => !focusedIds.includes(id)
    );

    this._initOrdinal(this.available);
    this._initOrdinal(this.selected);
    this._clearMenuState();
    this.focused = [];

    this._sendClickEvent();
  }

  /* selected -> available (왼쪽으로) */
  // 모든 아이템을 available로 옮깁니다
  toAvailableAll(): void {
    this.available = [...this.available, ...this.selected];
    this.selected = [];
    //
    this._initOrdinal(this.available);
    this._initOrdinal(this.selected);
    this._clearMenuState();
    this.focused = [];

    this._sendClickEvent();
  }

  // 선택된 아이템을 available로 옮깁니다
  toAvailable(): void {
    const focusedItems = this.selected.filter(item => item.focused === true);
    const focusedIds = focusedItems.reduce(reducer, []);
    this._clearFocused(focusedItems);
    this.available = [...this.available, ...focusedItems];

    this.selected = this.selected.filter(({ id }) => !focusedIds.includes(id));
    //
    this._initOrdinal(this.available);
    this._initOrdinal(this.selected);
    this._clearMenuState();
    this.focused = [];

    this._sendClickEvent();
  }

  /* 초기화 */
  reset(): void {
    console.log('모든 아이템들의 위치를 초기화 합니다');

    //
    this._clearMenuState();
  }

  /* 메뉴 아이템 이동 (selected만) */
  toUp(): void {
    const targetIdx = this.selected.findIndex(item => item.focused === true);

    this._clearFocused(this.selected);
    this._clearMenuState();

    if (targetIdx > 0) {
      this._swap(this.selected, targetIdx, targetIdx - 1);
    }
  }

  toDown(): void {
    const targetIdx = this.selected.findIndex(item => item.focused === true);

    this._clearFocused(this.selected);
    this._clearMenuState();

    if (targetIdx < this.selected.length - 1) {
      this._swap(this.selected, targetIdx, targetIdx + 1);
    }
  }

  /**
   * visible, invisible 여부에 따라 ordinal을 초기화해주는 함수
   * @param {Item[]} data 기존의 데이터
   * @returns {Item[]} 바뀐 형식의 데이터
   */
  _mapData(data: Item[]): [Item[], Item[]] {
    const { length } = data;
    const available = { ordinal: 0, items: [] };
    const selected = { ordinal: 0, items: [] };

    for (let i = 0; i < length; i++) {
      const item = data[i];

      if (!item.visible) {
        // available
        item.ordinal = available.ordinal++;
        available.items.push(item);
      } else {
        // selected
        item.ordinal = selected.ordinal++;
        selected.items.push(item);
      }
    }

    return [available.items, selected.items];
  }

  ngOnInit(): void {
    [this.available, this.selected] = this._mapData(this.data);
  }

  ngOnChanges(changes: SimpleChange) {
    // 변화를 감지하는 메소드
    // ➡️ 따라서 이벤트 발생 시 항상 같은 값을 준다면 (값에 변화가 없다면), 아래의 코드가 실행되지 않음
    console.log('changes');
    // for (const propName in changes) {
    //   console.log('>', changes[propName].currentValue);
    //   // 이 값은 this.inputData와 같은 값이다
    // }
  }
}
