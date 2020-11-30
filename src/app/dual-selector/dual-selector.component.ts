import { Component, AfterViewInit, Input, Output, EventEmitter, HostListener, TemplateRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from "rxjs/operators";

export class MenuItem {
  id: number;
  name: string;
  ordinal = 0;
  visible: boolean;
  focused = false;
  template: any;
  emoji?: string;


  constructor(json) {
    this.id = json.id;
    this.name = json.name;
    this.visible = json.visible;
    if (json.emoji !== undefined)
      this.emoji = json.emoji;
  }

  static parse(json: any): MenuItem {
    return new MenuItem(json);
  }
}

/**
 * available: 0,
 * selected: 1,
 * none: 2
 */
enum ItemState {
  available,
  selected,
  none,
}

enum ItemSize {
  xs = 'xs',
  s = 's',
  m = 'm'
}

enum SpecialKey {
  shift = "Shift",
  command = "Meta",
  ctrl = "Control"
}

/**
 * MenuItem들이 담겨있는 배열에서 id만 뽑아서 누적시키는 함수
 * @param acc 
 * @param curr 
 * @returns {number[]}
 */
const reducer = (acc: any[], curr: MenuItem) => {
  acc.push(curr.id);
  return acc;
};


@Component({
  selector: 'app-dual-selector',
  templateUrl: './dual-selector.component.html',
  styleUrls: ['./dual-selector.component.less'],
})
export class DualSelectorComponent implements AfterViewInit {
  // data 원형
  @Input()
  public set data(value: MenuItem[]) {
    this._data = value;

    [this.available, this.selected] = this._mapData(value);
    this._emitActionChangeEvent();
  }

  private _data: MenuItem[];
  public get data(): MenuItem[] {
    return this._data;
  }

  // template들
  @Input() templateText: TemplateRef<any>;
  @Input() templateEmojiText: TemplateRef<any>;

  // 소메뉴에 대한 값이 있는 변수
  @Input() controls: {
    availableSearch: {
      keyword: string,
      control: FormControl
    },
    selectedSearch: {
      keyword: string,
      control: FormControl
    },
    newAvailableTitle: {
      keyword: string,
      control: FormControl
    },
    newSelectedTitle: {
      keyword: string,
      control: FormControl
    },
    newHeight: {
      height: string,
      control: FormControl
    },
    newWidth: {
      width: string,
      control: FormControl
    }
  };
  // 소메뉴의 각 아이템들(타이틀 ON/OFF, 검색 ON/OFF ...)의 활성 상태에 대한 변수
  @Input() optionStateActive: {
    optionMenu: boolean,
    title: boolean,
    search: boolean,
    moveOne: boolean,
    showSelectedItemsCount: boolean
  };
  // 아이템의 크기 (xs, s, m)
  @Input() itemSize: ItemSize;

  // selected와 available의 현재 상태를 상위 컴포넌트에게 전달하는 event emiiter
  @Output() updateSelectedAvailable = new EventEmitter();
  // 초기화 버튼 클릭 시 이를 상위 컴포넌트에게 전달하는 event emitter
  @Output() reset = new EventEmitter();

  // available options에 보여지는 item들이 들어있는 배열
  available: MenuItem[] = [];
  // selected options에 보여지는 item들이 들어있는 배열
  selected: MenuItem[] = [];

  // 현재 focuse된 item들이 들어있는 배열
  focusedItems: number[] = [];
  // focuse된 selected item의 갯수
  selectedFocusedCount: number = 0;
  // focuse된 available item의 갯수
  availableFocusedCount: number = 0;

  // 현재 아이템이 선택된 state으로,
  // 서로 다른 영역(available, selected)의 item 클릭 시 분기 처리를 위해 사용하는 변수
  // onSelect, 드래그 이벤트에서 주로 사용한다
  currentSelectedItemState = ItemState.none;
  actionStateActive = {
    toSelectedAll: true,
    toAvailableAll: true,
    reset: true,
    toSelected: false,
    toAvailable: false,
  };


  // shift key가 눌렸는지 여부를 판단하는 변수
  // 시작~끝 아이템들을 선택하는 것 과 관련된 변수이다
  isShiftKeyDown: boolean = false;
  // control, command(Mac) key가 눌렸는지 여부를 판단하는 변수
  // 동시에 여러개의 아이템들을 하나씩 선택하는 것과 관련된 변수이다
  isCtrlKeyDown: boolean = false;

  // drag를 시작한 element (element)
  dragSourceElement: any;
  // drag를 시작한 item (item의 정보)
  dragSourceItem: MenuItem;


  constructor() { }


  ngOnInit(): void {
    this._initControl();
  }

  ngAfterViewInit() {
    this._initTemplate();
  }


  /* ********** key down, up 이벤트 ********** */
  /**
   * Escpae 키를 누르면(down) 호출되는 함수로,
   * 모든 focuse를 해제한다.
   * @param {KeyboardEvent} event 키보드 이벤트
   */
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKeydownHandler(event: KeyboardEvent) {
    this._initfocused(this.selected, false);
    this._initfocused(this.available, false);
    this._setCurrentItemState(ItemState.none);
    this.focusedItems = [];
    this.selectedFocusedCount = 0;
    this.availableFocusedCount = 0;
  }

  /**
   * Control, Command 키를 누르면(down) 호출되는 함수로,
   * 각각에 대해 isShiftKeyDown, isCtrlKeyDown 를 true 값으로 만들어준다.
   * isShitDown(시작~끝)과 isCtrlKeyDown(여러 개 동시 선택)은 onSelect에서 다중 선택에 대한 코드에서 사용된다.
   * @param {KeyboardEvent} event 키보드 이벤트
   */
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      // shift
      case SpecialKey.shift:
        event.preventDefault();
        this.isShiftKeyDown = true;
        break;

      case (SpecialKey.command):
      case (SpecialKey.ctrl):
        // command, control
        event.preventDefault();
        this.isCtrlKeyDown = true;
        break;
    }
  }

  /**
   * Control, Command 키를 떼면(up) 호출되는 함수로,
   * 각각에 대해 isShiftKeyDown, isCtrlKeyDown 를 false 값으로 만들어준다.
   * isShitDown(시작~끝)과 isCtrlKeyDown(여러 개 동시 선택)은 onSelect에서 다중 선택에 대한 코드에서 사용된다.
   * @param {KeyboardEvent} event 키보드 이벤트
   */
  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    switch (event.key) {
      // shift
      case SpecialKey.shift:
        event.preventDefault();
        this.isShiftKeyDown = false;
        break;

      case (SpecialKey.command):
      case (SpecialKey.ctrl):
        // command, control
        event.preventDefault();
        this.isCtrlKeyDown = false;
        break;
    }
  }

  /* ********** 드래그 앤 드롭 이벤트에 대한 함수들 ********** */
  /**
   * drag 시작 시 호출되는 함수
   * @param event 드래그 하고 있는 item
   * @param item 
   * @param state 
   */
  onDragStart(event: DragEvent, item: MenuItem, state: string) {
    if (ItemState[state] === 0) return;
    this.dragSourceElement = event.target;
    this.dragSourceItem = item;
    this._setCurrentItemState(ItemState[state]);

    this.dragSourceElement.style.opacity = '0.4';

    event.dataTransfer.effectAllowed = 'move';
  }

  /**
   * drag 가능 아이템에 마우스를 대고있으면 계속 호출되는 함수
   * @param {DragEvent} event 다른 item
   * @param {string} state 다른 item의 현재 state (available || selected)
   */
  onDragOver(event: DragEvent, state: string) {
    if (ItemState[state] === 0) return;

    if (event.preventDefault) {
      event.preventDefault();
    }

    event.dataTransfer.dropEffect = 'move';

    return false;
  }

  /**
   * 다른 item 위에 들어가면, !단 한번만! 호출되는 함수
   * @param {DragEvent} event 다른 item
   * @param {string} state 다른 item의 현재 state (available || selected)
   */
  onDragEnter(event: DragEvent, state: string) {
    if (ItemState[state] === 0) return;

    const otherNode = <HTMLElement>event.target;
    otherNode.classList.add('over');
  }


  /**
   * drag 포커스가 떠날 때 한 번 호출되는 함수
   * @param event 다른 item
   * @param {string} state 다른 item의 현재 state (available || selected)
   */
  onDragLeave(event: DragEvent, state: string) {
    if (ItemState[state] === 0) return;

    const otherNode = <HTMLElement>event.target;
    otherNode.classList.remove('over');

  }

  /**
   * 다른 item에 떨어뜨리면 호출되는 함수
   * @param event 다른 item
   * @param {string} state 다른 item의 현재 state (available || selected)
   */
  onDrop(event: DragEvent, otherItem: MenuItem, state: string) {
    const otherElement = <HTMLElement>event.target;

    if (ItemState[state] === 0) return;
    if (!otherElement.classList.contains('list__item')) return false;


    if (event.stopPropagation) {
      event.stopPropagation(); // stops the browser from redirecting.
    }


    if (this.dragSourceElement !== this) {
      let sourceOrdinal: number, otherOrdinal: number;

      // Selected
      sourceOrdinal = this.dragSourceItem.ordinal;
      otherOrdinal = otherItem.ordinal;

      [this.selected[sourceOrdinal].ordinal, this.selected[otherOrdinal].ordinal] =
        [this.selected[otherOrdinal].ordinal, this.selected[sourceOrdinal].ordinal]
    }

    return false;

  }

  /**
   * 뭐가 되었든, 드래그가 끝나면 호출되는 item
   * @param event 현재 item
   */
  onDragEnd(event: DragEvent, state: string) {
    if (ItemState[state] === 0) return;

    switch (ItemState[state]) {
      case 0:
        document.querySelectorAll('.available__list .list__item')
          .forEach(item =>
            item.classList.remove('over')
          );
        break;

      case 1:
        document.querySelectorAll('.selected__list .list__item')
          .forEach(item =>
            item.classList.remove('over')
          );
        break;
    }

    this._emitActionChangeEvent();
    this.dragSourceElement.style.opacity = '1';
    this.dragSourceElement.classList.remove('over');
  }


  /* ********** 내부 함수 ********** */
  /**
   * data로부터 각 item의 visible 속성에 따라, 
   * visible이 true면 available에 추가를,
   * visible이 false면 selected에 추가를 해주어
   * 각 배열을 초기화해주는 함수이다.
   * 그리고 ordinal도 available, selected 각각에 맞게 초기화 해준다.
   * @param {MenuItem[]} data 기존의 데이터
   * @returns {[MenuItem[], MenuItem[]]} 바뀐 형식의 데이터 (0: available, 1: selected)
   */
  private _mapData(data: MenuItem[]): [MenuItem[], MenuItem[]] {
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

  /**
   * 타이핑 시 debounce를 위한 초기화 함수
   */
  private _initControl() {
    Object.keys(this.controls).forEach(key => {
      // debounce 
      this.controls[key].control.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged()
        )
        .subscribe(data => {
          if (this.controls[key].keyword !== undefined)
            this.controls[key].keyword = data;

          if (this.controls[key].width !== undefined)
            this.controls[key].width = data;

          if (this.controls[key].height !== undefined)
            this.controls[key].height = data;

        })

    })
  }


  /**
   * template을 각 item들에 달아주는 함수
   */
  private _initTemplate() {
    this.available.map(item => item.template = this.templateEmojiText);
    this.selected.map(item => item.template = this.templateEmojiText);
  }

  /**
   * _toggleIdFocused, _pushToFocused 에서 호출하는 함수로,
   * 인자로 받은 state가 available 이라면 availableFocusedCount를 증가시키고, 
   * state가 selected 라면 selectedFocusedCount를 증가시킨다.
   * @param {ItemState} state focusedCount를 늘릴 state
   */
  private _increaseFocuseCount(state: ItemState) {
    switch (state) {
      case ItemState.available:
        this.availableFocusedCount++;
        break;

      case ItemState.selected:
        this.selectedFocusedCount++;
        break;
    }
  }

  /**
   * 인자로 받은 id가 focused에 이미 있다면 빼고, 없었다면 focused에 추가하는 함수로,
   * 이 때 state가 available 이라면 availableFocusedCount를 증가시키고, 
   * state가 selected 라면 selectedFocusedCount를 증가시킨다.
   * @param {number} id 임의의 item의 id
   * @param {ItemState} state focusedCount를 늘릴 state
   */
  private _toggleIdFocused(id: number, state: ItemState) {
    if (!this.focusedItems.includes(id)) {
      this.focusedItems.push(id);

      this._increaseFocuseCount(state);

    } else {
      this.focusedItems = this.focusedItems.filter(focusId => focusId !== id);
      switch (state) {
        case ItemState.available:
          this.availableFocusedCount--;
          break;

        case ItemState.selected:
          this.selectedFocusedCount--;
          break;
      }
    }
  }



  /**
   * 인자로 받은 id가 focused에 없었다면 추가하고, 있었다면 무시하는 함수로,
   * 이 때 state가 available 이라면 availableFocusedCount를 증가시키고, 
   * state가 selected 라면 selectedFocusedCount를 증가시킨다.
   * @param {number} id 임의의 item의 id
   * @param {ItemState} state focusedCount를 늘릴 state
   */
  private _pushToFocused(id: number, state: ItemState) {
    if (!this.focusedItems.includes(id)) {
      this.focusedItems.push(id);

      this._increaseFocuseCount(state);
    }
  }

  /**
   * 아이템 이동시 사용하는 메뉴들의 state를 default 값으로 초기화해주는 함수이다.
   * 기본값은 전체 양방향 이동(<<, >>), 초기화(↩️)는 true,
   * 선택된 아이템 양방향 이동(<, >)는 false.
   */
  private _initActionStateActive() {
    this.actionStateActive = {
      toSelectedAll: true,
      toAvailableAll: true,
      reset: true,
      toSelected: false,
      toAvailable: false,
    };
  }

  /**
   * currentSelectedItemState를 임의의 state로 set해주는 함수
   * @param {ItemState} state 
   */
  private _setCurrentItemState(state: ItemState): void {
    this.currentSelectedItemState = state;
  }

  /**
   * currentSelectedItemState를 none으로 초기화하는 함수
   */
  private _clearCurrentItemState(): void {
    this.currentSelectedItemState = ItemState.none;
  }

  /**
   * 인자로 받은 list(available, selected) 에서 인자로 받은 id를 갖는 item의 focused를 toggle하는 함수
   * @param {MenuItem[]} list available || seleted
   * @param id 임의의 item의 id
   */
  private _toggleFocus(list: MenuItem[], id: number): void {
    list.map(item => (item.id === id ? (item.focused = !item.focused) : item));
  }

  /**
   * 인자로 받은 list(available, selected) 의 item들의 ordinal을 0부터 N까지 초기화해주는 함수
   * @param {MenuItem[]} list available || seleted
   */
  private _initOrdinal(list: MenuItem[]): void {
    for (let i = 0; i < list.length; i++) {
      list[i].ordinal = i;
    }
  }

  /**
   * 인자로 받은 list(available, selected) 에서 idx1과 idx2의 자리를 바꿔주는 함수
   * @param list available || seleted
   * @param idx1 
   * @param idx2 
   */
  private _swap(list: MenuItem[], idx1: number, idx2: number): void {
    [list[idx1], list[idx2]] = [list[idx2], list[idx1]];
    list[idx1].ordinal = idx1;
    list[idx2].ordinal = idx2;
  }

  /**
   * 드래그(onDragEnd)나, 아이템 이동 이후에 호출되는 함수로,
   * 바뀐 selected와 available을 각각 id들만 모아 부모에게 이벤트를 보냄
   */
  private _emitActionChangeEvent(): void {
    this.updateSelectedAvailable.emit({
      selected: this.selected.reduce(reducer, []),
      available: this.available.reduce(reducer, [])
    });

  }

  /**
   * 인자로 받은 list(available, selected) 의 item들을 v로 set해주는 함수
   * @param {MenuItem[]} list available || selected
   * @param {boolean} v 초기화할 값
   */
  private _initfocused(list: MenuItem[], v: boolean): void {
    for (let i = 0; i < list.length; i++) {
      list[i].focused = v;
    }
  }


  /**
   * [available] 검색 keyword에 따른 결과만 노출시키는 함수
   */
  getAvailable(): MenuItem[] {
    const ret = [];

    this.available
      .sort((itemA, itemB) => itemA.ordinal - itemB.ordinal)
      .forEach(item => {
        if (item.name.includes(this.controls.availableSearch.keyword))
          ret.push(item)
      })

    return ret;
  }


  /**
   * [selected] 검색 keyword에 따른 결과만 노출시키는 함수
   */
  getSelected(): MenuItem[] {
    const ret = [];

    this.selected
      .sort((itemA, itemB) => itemA.ordinal - itemB.ordinal)
      .forEach(item => {
        if (item.name.includes(this.controls.selectedSearch.keyword))
          ret.push(item)
      })

    return ret;
  }


  /**
   * 임의의 item이 선택되었을 때 불리는 함수
   * @param {string} state 현재 state (available || selected)
   * @param {MenuItem} item 현재 선택된 item
   */
  onSelect(state: string, item: MenuItem): void {
    const { id } = item;

    if (
      (!this.optionStateActive.moveOne) &&
      (this.currentSelectedItemState !== ItemState.none) &&
      (this.currentSelectedItemState !== ItemState[state])
    ) {
      this._initfocused(this.available, false);
      this._initfocused(this.selected, false);
      this._setCurrentItemState(ItemState.none);
      this.focusedItems = [];

      this.selectedFocusedCount = 0;
      this.availableFocusedCount = 0;
      return;
    }


    if (
      (!this.optionStateActive.moveOne) ||
      (this.optionStateActive.moveOne && this.isShiftKeyDown) ||
      (this.optionStateActive.moveOne && this.isCtrlKeyDown)
    ) {
      this._toggleIdFocused(id, ItemState[state]);

      if (this.isShiftKeyDown) {
        let list: number[], from: number, to: number;
        switch (ItemState[state]) {
          case 0:
            list = this.focusedItems.map(focusedItemId => (
              this.available.findIndex(({ id }) => id === focusedItemId)
            )).filter(id => id > -1)

            from = Math.min(...list);
            to = Math.max(...list);

            if (from !== Infinity && to !== -Infinity) {
              for (let i = from; i <= to; i++) {
                this.available[i].focused = true;
                this._pushToFocused(this.available[i].id, ItemState[state]);
              }
            } else {
              this.isShiftKeyDown = false;
            }
            break;

          case 1:
            list = this.focusedItems.map(focusedItemId => (
              this.selected.findIndex(({ id }) => id === focusedItemId)
            )).filter(id => id > -1)

            from = Math.min(...list);
            to = Math.max(...list);

            if (from !== Infinity && to !== -Infinity) {
              for (let i = from; i <= to; i++) {
                this.selected[i].focused = true;
                this._pushToFocused(this.selected[i].id, ItemState[state]);
              }
            } else {
              this.isShiftKeyDown = false;
            }
            break;
        }

      } else if (
        (!this.optionStateActive.moveOne) ||
        (this.optionStateActive.moveOne && this.isCtrlKeyDown)
      ) {
        switch (ItemState[state]) {
          case 0:
            this._toggleFocus(this.available, id);
            break;

          case 1:
            this._toggleFocus(this.selected, id);
            break;
        }
      }

      this._setCurrentItemState(ItemState[state]);


      if (this.focusedItems.length === 0) { // 선택된 것이 없는 경우
        this._setCurrentItemState(ItemState.none); // menu state 초기화
        this._initActionStateActive();      // 메뉴(action) 상태 초기화
        this._initfocused(this.selected, false);
        this._initfocused(this.available, false);

      } else {
        switch (this.currentSelectedItemState) {
          case ItemState.available:
            this.actionStateActive = {
              ...this.actionStateActive,
              toAvailable: false,
              toSelected: true,
            };
            break;

          case ItemState.selected:
            this.actionStateActive = {
              ...this.actionStateActive,
              toAvailable: true,
              toSelected: false,
            };
            break;
        }
      }


    } else {
      // moveOne ON(하나만 선택 ON)
      this.focusedItems = [];
      switch (ItemState[state]) {
        case 0:
          this.availableFocusedCount = 0;
          this.selectedFocusedCount = 0;
          this._initfocused(this.available, false);
          this._initfocused(this.selected, false);
          this._toggleFocus(this.available, id);
          this.actionStateActive = {
            ...this.actionStateActive,
            toAvailable: false,
            toSelected: true,
          };
          break;

        case 1:
          this.availableFocusedCount = 0;
          this.selectedFocusedCount = 0;
          this._initfocused(this.available, false);
          this._initfocused(this.selected, false);
          this._toggleFocus(this.selected, id);
          this.actionStateActive = {
            ...this.actionStateActive,
            toAvailable: true,
            toSelected: false,
          };
          break;
      }
      this._toggleIdFocused(id, ItemState[state]);

    }
  }

  /* ********** 아이템 이동(<, <<, >, >>, ↩️)과 관련된 함수들 ********** */
  /**
   * 모든 item들을 available => selected 로 옮기는 함수
   */
  toSelectedAll(): void {
    this.selected = [...this.selected, ...this.available];
    this.available = [];

    this._initOrdinal(this.selected);
    this._clearCurrentItemState();
    this.focusedItems = [];
    this.availableFocusedCount = 0;
    this.selectedFocusedCount = 0;

    this._emitActionChangeEvent();
    this._initActionStateActive();

  }

  /**
   * 선택된 item들을 available => selected 로 옮기는 함수
   */
  toSelected(): void {
    const focusedItems = this.available.filter(item => item.focused === true);
    const focusedIds = focusedItems.reduce(reducer, []);
    this._initfocused(focusedItems, false);
    this.selected = [...this.selected, ...focusedItems];

    this.available = this.available.filter(
      ({ id }) => !focusedIds.includes(id)
    );

    this._initOrdinal(this.available);
    this._initOrdinal(this.selected);
    this._clearCurrentItemState();

    this._emitActionChangeEvent();
    this._initActionStateActive();

    this.focusedItems = [];
    this.availableFocusedCount = 0;
    this.selectedFocusedCount = 0;

  }


  /**
   * 모든 item들을 available <= selected 로 옮기는 함수
   */
  toAvailableAll(): void {
    this.available = [...this.available, ...this.selected];
    this.selected = [];

    this._initOrdinal(this.available);
    this._initOrdinal(this.selected);
    this._clearCurrentItemState();

    this._emitActionChangeEvent();
    this._initActionStateActive();

    this.focusedItems = [];
    this.availableFocusedCount = 0;
    this.selectedFocusedCount = 0;
  }

  /**
   * 선택된 item들을 available <= selected 로 옮기는 함수
   */
  toAvailable(): void {
    const focusedItems = this.selected.filter(item => item.focused === true);
    const focusedIds = focusedItems.reduce(reducer, []);
    this._initfocused(focusedItems, false);

    this.available = [...this.available, ...focusedItems];
    this.selected = this.selected.filter(({ id }) => !focusedIds.includes(id));

    this._initOrdinal(this.available);
    this._initOrdinal(this.selected);
    this._clearCurrentItemState();

    this._emitActionChangeEvent();
    this._initActionStateActive();

    this.focusedItems = [];
    this.availableFocusedCount = 0;
    this.selectedFocusedCount = 0;
  }

  /**
   * 초기화 버튼을 누르면 호출되는 함수
   */
  resetItems(): void {
    this.reset.emit();
    setTimeout(() => {
      this._initTemplate();
    }, 0);
  }

}

