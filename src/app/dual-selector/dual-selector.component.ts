/**
 * TODO
 * > 스타일 (notion 참고)
 * [x] 아이템 이름이 많이 길 때 tooltip으로 잘려진 부분 볼 수 있도록
 * [ ] 이미지와 아이콘을 넣고 싶다면? - angular에서 지원하는 template ~ <ng-template>
 * => cmpt 안에서 template을 어떻게 활용할 수 있는지 생각해보기
 * 내가 원하는 값이 표시가 될 수 있도록
 * 
 * > 소메뉴
 * [x] 타이틀 보이기 on/off
 * [x] Available, Selected 이름 변경
 * [x] search on/off
 * [x] 하나씩만 옮기기 on/off
 * [x] 아이템 크기 크게/작게
 * [x] width 크기 조정
 * [x] height 크기 조정
 * [x] 선택된 아이템 갯수 표시
 * 레퍼런스 찾아보기 https://angular.kr/guide/structural-directives#ng-template
 * 
 * > 기능
 * [x] multi select => 최소, 최대
 * [ ] 드래그/드롭 직접 구현 - HTML5의 drag&drop
 * https://developer.mozilla.org/ko/docs/Web/API/HTML_%EB%93%9C%EB%9E%98%EA%B7%B8_%EC%95%A4_%EB%93%9C%EB%A1%AD_API
 */

import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';

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

enum ItemSize {
  xs = 'xs',
  s = 's',
  m = 'm'
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
  timer;

  @Input() data: MenuItem[];
  @Output() actionChange = new EventEmitter();
  @Output() reset = new EventEmitter();

  availableTitle: string="Available Options";
  selectedTitle: string="Selected Options";

  available: MenuItem[] = [];
  availableSearchKeyword:string = '';
  
  selected: MenuItem[] = [];
  selectedSearchKeyword:string = '';

  focused: number[] = [];
  selectedFocusedCount: number = 0;
  availableFocusedCount: number = 0;
  
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

  optionStateActive = {
    optionMenu: true,
    title: true,
    search: true,
    moveOne: false,
    showSelectedItemsCount: true
  }

  itemSize:string = ItemSize.s;

  maxWidth:number = 171;
  maxHeight: number = 300;

  isShiftKeyDown: boolean = false;

  constructor() {}

  ngOnInit(): void {
    [this.available, this.selected] = this._mapData(this.data);
    this._emitActionChangeEvent();
  }

  ngOnChanges({ data: { currentValue } }): void {
    [this.available, this.selected] = this._mapData(currentValue);
    this._emitActionChangeEvent();
  }

  // esc key
  @HostListener('document:keydown.escape', ['$event']) 
  onEscapeKeydownHandler(evt: KeyboardEvent) {
    this._clearFocused(this.selected);
    this._clearFocused(this.available);
    this.focused = [];
    this.selectedFocusedCount = 0;
    this.availableFocusedCount = 0;
  }

  // shift key
  @HostListener('document:keydown.shift', ['$event']) 
  onShiftKeydownHandler(evt: KeyboardEvent) {
    this.isShiftKeyDown = true;
  }

  @HostListener('document:keyup.shift', ['$event']) 
  onShiftKeyupHandler(evt: KeyboardEvent) {
    this.isShiftKeyDown = false;
  }

  /**
   * id가 없으면 focused에 넣고, 있으면 focused에서 빼기
   * @param {number} id 
   */
  private _toggleIdFocused(id:number, state:MenuState) {
    if (!this.focused.includes(id)) {
      this.focused.push(id);

      switch(state) {
        case MenuState.available:
          this.availableFocusedCount++;
          break;

        case MenuState.selected:
          this.selectedFocusedCount++;
          break;
      }

    } else {
      this.focused = this.focused.filter(focusId => focusId !== id);
      switch(state) {
        case MenuState.available:
          this.availableFocusedCount--;
          break;

        case MenuState.selected:
          this.selectedFocusedCount--;
          break;
      }
    }
  }

  /**
   * id가 없을 때에만 focused에 넣기, 이미 있으면 무시
   * @param {number} id 
   */
  private _pushToFocused(id:number, state:MenuState) {
    if (!this.focused.includes(id)) {
      this.focused.push(id);

      switch(state) {
        case MenuState.available:
          this.availableFocusedCount++;
          break;

        case MenuState.selected:
          this.selectedFocusedCount++;
          break;
      }

    }
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

  private _focusedInit(list: MenuItem[], v:boolean):void {
    for(let i=0; i<list.length; i++) {
      list[i].focused = v;
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

  onChangeAvailableTitle(newTitle:string) {
    this.availableTitle = newTitle;
  }

  onChangeSelectedTitle(newTitle:string) {
    this.selectedTitle = newTitle;
  }

  onSizeChange(size) {
    this.itemSize = size;
  }

  onSettingMenuClick() {
    this.optionStateActive.optionMenu = !this.optionStateActive.optionMenu;
  }
  onTitleClick() {
    this.optionStateActive.title = !this.optionStateActive.title 
  }
  onSearchClick() {
    this.optionStateActive.search = !this.optionStateActive.search 
  }
  onMoveOnClick() {
    this.optionStateActive.moveOne = !this.optionStateActive.moveOne 
  }
  onSelectedItemsCountClick() {
    this.optionStateActive.showSelectedItemsCount = 
    !this.optionStateActive.showSelectedItemsCount 
  }

  onSearchMaxWidthChange(newMaxWidth:number) {

    clearTimeout(this.timer);
    this.timer = setTimeout(()=>{
      this.maxWidth = newMaxWidth
    }, 100)
  }

  onSearchMaxHeightChange(newMaxHeight: number) {
    clearTimeout(this.timer);
    this.timer = setTimeout(()=>{
      this.maxHeight = newMaxHeight
    }, 100)
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

    // if(this.optionStateActive.moveOne)
    // this.optionStateActive.moveOne === true
    // this.optionStateActive.moveOne === false
    /**
     * 만약 [한 개만 움직이기] 상태일 경우, this.focused 길이가 0일때만 아래 가능
     * 만약 [한 개만 움직이기]
     */

     if(
       (this.optionStateActive.moveOne && this.focused.length === 0) ||
       (!this.optionStateActive.moveOne) ||
       (this.focused[0] === id)
     ) {

      this._toggleIdFocused(id, MenuState[state]);

      switch(state) {
        case 'available':
          if (
            this.menuState !== MenuState.none &&
            MenuState[state] !== this.menuState
            ) {
              this._focusedInit(this.selected, false);
              this._focusedInit(this.available, false);
              this.focused = [];
              this.availableFocusedCount = 0;
              this.selectedFocusedCount = 0;
            }
          break;

        case 'selected':
          if (
            this.menuState !== MenuState.none &&
            MenuState[state] !== this.menuState
            ) {
              this._focusedInit(this.selected, false);
              this._focusedInit(this.available, false);
              this.focused = [];
              this.availableFocusedCount = 0;
              this.selectedFocusedCount = 0;
            }
          break;
      }


      if(this.isShiftKeyDown) {
        let list:number[], from:number, to:number;

        switch(state) {
          case 'available':
            list = this.focused.map(focusedItemId => (
              this.available.findIndex(({id})=>id === focusedItemId)
            ))

            from = Math.min(...list);
            to = Math.max(...list);

            if(from !== Infinity && to !== -Infinity){
              for(let i=from; i<=to; i++) {
                this.available[i].focused = true;
                this._pushToFocused(this.available[i].id, MenuState[state]);
              }
            } else {
              this.isShiftKeyDown = false;
            }

            break;

          case 'selected':
            list = this.focused.map(focusedItemId => (
              this.selected.findIndex(({id})=>id === focusedItemId)
            ))        

            from = Math.min(...list);
            to = Math.max(...list);

            if(from !== Infinity && to !== -Infinity){
              for(let i=from; i<=to; i++) {
                this.selected[i].focused = true;
                this._pushToFocused(this.selected[i].id, MenuState[state]);
              }
            }else {
              this.isShiftKeyDown = false;
            }

            break;
        }

      } else {

        switch (state) {
          case 'available':
            this._toggleFocus(this.available, id);
            break;
    
          case 'selected':
            this._toggleFocus(this.selected, id);
            break;
        }

      }



      this._setMenuState(MenuState[state]);

      if (this.focused.length === 0) { // 선택된 것이 없는 경우
        this._setMenuState(MenuState.none); // menu state 초기화
        this._initActionStateActive();      // 메뉴(action) 상태 초기화
        this._focusedInit(this.selected, false);
        this._focusedInit(this.available, false);

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

  }
  // setter, getter
  /* available -> selected (오른쪽으로) */
  toSelectedAll(): void {
    // 모든 아이템을 selected로 옮깁니다
    this.selected = [...this.selected, ...this.available];
    this.available = [];

    this._initOrdinal(this.selected);
    this._clearMenuState();
    this.focused = [];
    this.availableFocusedCount = 0;
    this.selectedFocusedCount = 0;

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
    this.availableFocusedCount = 0;
    this.selectedFocusedCount = 0;

  }

  /* selected -> available (왼쪽으로) */
  // 모든 아이템을 available로 옮깁니다
  toAvailableAll(): void {
    this.available = [...this.available, ...this.selected];
    this.selected = [];

    this._initOrdinal(this.available);
    this._initOrdinal(this.selected);
    this._clearMenuState();

    this._emitActionChangeEvent();
    this._initActionStateActive();

    this.focused = [];
    this.availableFocusedCount = 0;
    this.selectedFocusedCount = 0;
  }

  // 선택된 아이템을 available로 옮깁니다
  toAvailable(): void {
    const focusedItems = this.selected.filter(item => item.focused === true);
    const focusedIds = focusedItems.reduce(reducer, []);
    this._clearFocused(focusedItems);

    this.available = [...this.available, ...focusedItems];

    this.selected = this.selected.filter(({ id }) => !focusedIds.includes(id));

    this._initOrdinal(this.available);
    this._initOrdinal(this.selected);
    this._clearMenuState();

    this._emitActionChangeEvent();
    this._initActionStateActive();

    this.focused = [];
    this.availableFocusedCount = 0;
    this.selectedFocusedCount = 0;
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
    this.availableFocusedCount = 0;
    this.selectedFocusedCount = 0;
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
    this.availableFocusedCount = 0;
    this.selectedFocusedCount = 0;
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
