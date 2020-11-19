/**
 * TODO
 * > 스타일 (notion 참고)
 * ( ) fontawesome 4.7
 * ( ) item -> 왼쪽 정렬 / 영역 너비 반정도 줄이기 / 아이템들 패딩 
 * ( ) 아이템 이름이 많이 길 때 -> ... 붙이기, title attribute (HTML) - tooltip으로 잘려진 부분 볼 수 있도록
 * ( ) input -> bootstrap input sm 적용
 * ( ) 가운데 버튼들 -> vertical align 가운데 / 가로폭 줄이기
 * ( ) 영역 높이 -> 입력으로
 * 
 * > 기능
 * ( ) shift 키 multi select (시작~끝) => flag 지정, (keyup.enter)="onEnterKeyUp($event)"
 * ( ) ESC 키 -> 전체 선택 해제
 * ( ) 드래그/드롭 직접 구현 - HTML5의 drag&drop
 */

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { faAngleRight,  faAngleDoubleRight, faAngleLeft, faAngleDoubleLeft,faAngleUp, faAngleDown ,faUndo} from '@fortawesome/free-solid-svg-icons';

export class MenuItem {
  id: number;
  name: string;
  ordinal = 0;
  visible: boolean;
  focused = false;


  constructor(json) {
    this.id = json.id;
    this.name = json.name;
    this.visible = json.visible;
  }

  static parse(json: any): MenuItem {
    return new MenuItem(json);
  }
}

enum MenuState {
  available,
  selected,
  none,
}

enum ActionTypes {
  addAll,
  add,
  removeAll,
  remove,
  reset,
  up,
  down,
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
  faAngleRight = faAngleRight;
  faAngleLeft = faAngleLeft;
  faAngleDoubleRight = faAngleDoubleRight;
  faAngleDoubleLeft = faAngleDoubleLeft;
  faAngleUp = faAngleUp;
  faAngleDown = faAngleDown;
  faUndo = faUndo;
  timer;

    movies = [
    'Episode I - The Phantom Menace',
    'Episode II - Attack of the Clones',
    'Episode III - Revenge of the Sith',
    'Episode IV - A New Hope',
    'Episode V - The Empire Strikes Back',
    'Episode VI - Return of the Jedi',
    'Episode VII - The Force Awakens',
    'Episode VIII - The Last Jedi',
    'Episode IX – The Rise of Skywalker'
  ];


  @Input() data: MenuItem[];
  @Output() actionChange = new EventEmitter();
  @Output() reset = new EventEmitter();

  available: MenuItem[] = [];
  availableSearchKeyword:string = '';
  
  selected: MenuItem[] = [];
  selectedSearchKeyword:string = '';

  focused: number[] = [];
  menuState = MenuState.none;
  actionStateActive = {
    toSelectedAll: true,
    toAvailableAll: true,
    reset: true,
    toSelected: false,
    toAvailable: false,
    up: false,
    down: false,
  };

  constructor() {}



  ngOnInit(): void {
    [this.available, this.selected] = this._mapData(this.data);
    this._emitActionChangeEvent();
  }

  ngOnChanges({ data: { currentValue } }): void {
    [this.available, this.selected] = this._mapData(currentValue);
    this._emitActionChangeEvent();
  }


  private _initActionStateActive() {
    this.actionStateActive = {
      toSelectedAll: true,
      toAvailableAll: true,
      reset: true,
      toSelected: false,
      toAvailable: false,
      up: false,
      down: false,
    };
  }

  private _setMenuState(state: MenuState): void {
    this.menuState = state;
  }
  private _clearMenuState(): void {
    this.menuState = MenuState.none;
  }

  private _toggleFocus(list: MenuItem[], id: number): void {
    list.map(item => (item.id === id ? (item.focused = !item.focused) : item));
  }

  private _initOrdinal(list: MenuItem[]): void {
    for (let i = 0; i < list.length; i++) {
      list[i].ordinal = i;
    }
  }

  private _clearFocused(list: MenuItem[]): void {
    list.map(item => (item.focused = false));
  }

  private _swap(list: MenuItem[], idx1: number, idx2: number): void {
    [list[idx1], list[idx2]] = [list[idx2], list[idx1]];
    list[idx1].ordinal = idx1;
    list[idx2].ordinal = idx2;
  }

  private _emitActionChangeEvent(): void {
    this.actionChange.emit({
      selected: this.selected.reduce(reducer, []),
      available: this.available.reduce(reducer, []),
    });
  }

  private _focusedInit(list: MenuItem[]):void {
    for(let i=0; i<list.length; i++) {
      list[i].focused = false;
    }
  }

  getSelected() {
    const ret = [];
    this.selected.forEach(item => {
      if(item.name.includes(this.selectedSearchKeyword))
        ret.push(item)
    })
    return ret;
  }

  getAvailable() {
    const ret = [];
    this.available.forEach(item => {
      if(item.name.includes(this.availableSearchKeyword))
        ret.push(item)
    })
    return ret;
  }



  onSearchAvailableChange(keyword) {
    clearTimeout(this.timer);
    this.timer = setTimeout(()=>{
      this.availableSearchKeyword = keyword;
    }, 100)
  }

  onSearchSelectedChange(keyword) {
    clearTimeout(this.timer);
    this.timer = setTimeout(()=>{
      this.selectedSearchKeyword = keyword;
    },100)
  }


  onSelect(state: string, item: MenuItem): void {
    const { id } = item;

    if (!this.focused.includes(id)) {
      this.focused.push(id);
    } else {
      this.focused = this.focused.filter(focusId => focusId !== id);
    }


    switch (state) {
      case 'available':
        if (
          this.menuState !== MenuState.none &&
          MenuState[state] !== this.menuState
        ) {
          this._focusedInit(this.selected);
        }
        this._toggleFocus(this.available, id);
        break;

      case 'selected':
        if (
          this.menuState !== MenuState.none &&
          MenuState[state] !== this.menuState
        ) {
          this._focusedInit(this.available);
        }
        this._toggleFocus(this.selected, id);
        break;
    }

    this._setMenuState(MenuState[state]);

    if (this.focused.length === 0) {
      this._setMenuState(MenuState.none);
      this._initActionStateActive();
    } else {
      switch (this.menuState) {
        case MenuState.available:
          // available 인 경우 (좌측)
          // -> remove 비활성화
          this.actionStateActive = {
            ...this.actionStateActive,
            toAvailable: false,
            toSelected: true,
          };
          break;

        case MenuState.selected:
          // selected 인 경우 (좌측)
          // <- add 비활성화
          this.actionStateActive = {
            ...this.actionStateActive,
            toAvailable: true,
            toSelected: false,
          };
          break;
      }
    }

    if (state === 'selected') {
      if (this.focused.length === 0 || this.focused.length > 1) {
        this.actionStateActive = {
          ...this.actionStateActive,
          up: false,
          down: false,
        };
      } else {
        // selected 에서
        // 한개만 클릭된 경우

        const { ordinal } = this.selected.filter(
          item => item.id === this.focused[0]
        )[0];

        if (this.selected.length === 1) {
          this.actionStateActive = {
            ...this.actionStateActive,
            up: false,
            down: false,
          };
        } else {
          if (ordinal === 0) {
            this.actionStateActive = {
              ...this.actionStateActive,
              up: false,
              down: true,
            };
          } else if (ordinal === this.selected.length - 1) {
            this.actionStateActive = {
              ...this.actionStateActive,
              up: true,
              down: false,
            };
          } else {
            this.actionStateActive = {
              ...this.actionStateActive,
              up: true,
              down: true,
            };
          }
        }
      }
    } else {
    }
  }
  // setter, getter
  /* available -> selected (오른쪽으로) */
  toSelectedAll(): void {
    // 모든 아이템을 selected로 옮깁니다
    this.selected = [...this.selected, ...this.available];
    this.available = [];
    //
    // this._initOrdinal(this.available);
    this._initOrdinal(this.selected);
    this._clearMenuState();
    this.focused = [];

    this._emitActionChangeEvent();
    this._initActionStateActive();

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

    this._emitActionChangeEvent();
    this._initActionStateActive();

    this.focused = [];

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

    this._emitActionChangeEvent();
    this._initActionStateActive();

    this.focused = [];
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

    this._emitActionChangeEvent();
    this._initActionStateActive();

    this.focused = [];
  }

  /* 초기화 */
  resetItems(): void {
    this.reset.emit('초기화');
  }

  /* 메뉴 아이템 이동 (selected만) */
  toUp(): void {
    const targetIdx = this.selected.findIndex(item => item.focused === true);

    this._clearFocused(this.selected);
    this._clearMenuState();

    if (targetIdx > 0) {
      this._swap(this.selected, targetIdx, targetIdx - 1);
    }

    this.focused = [];
    this._initActionStateActive();
  }

  toDown(): void {
    const targetIdx = this.selected.findIndex(item => item.focused === true);

    this._clearFocused(this.selected);
    this._clearMenuState();

    if (targetIdx < this.selected.length - 1) {
      this._swap(this.selected, targetIdx, targetIdx + 1);
    }

    this.focused = [];
    this._initActionStateActive();
  }

  /**
   * visible, invisible 여부에 따라 ordinal을 초기화해주는 함수
   * @param {MenuItem[]} data 기존의 데이터
   * @returns {MenuItem[]} 바뀐 형식의 데이터
   */
  _mapData(data: MenuItem[]): [MenuItem[], MenuItem[]] {
    const { length } = data;
    const available = { ordinal: 0, items: [] };
    const selected = { ordinal: 0, items: [] };

    for (let i = 0; i < length; i++) {
      const item = data[i];

      if (item.visible === false) {
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
}
