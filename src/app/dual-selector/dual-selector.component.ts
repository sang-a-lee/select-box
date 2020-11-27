import { Component, AfterViewInit, Input, Output, EventEmitter, HostListener, TemplateRef } from '@angular/core';
import { FormControl } from "@angular/forms";
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

enum SpecialKey {
  shift = "Shift",
  command = "Meta",
  ctrl = "Control"
}


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
  @Input() data: MenuItem[];

  // app 에서 넘겨주는 template
  @Input() templateText: TemplateRef<any>;
  @Input() templateEmojiText: TemplateRef<any>;

  @Output() actionChange = new EventEmitter();
  @Output() reset = new EventEmitter();


  @Input() controls;
  @Input() optionStateActive;
  @Input() itemSize: ItemSize;

  timer: number;

  available: MenuItem[] = [];
  availableSearchKeyword: string = '';

  selected: MenuItem[] = [];
  selectedSearchKeyword: string = '';

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
  };


  isShiftKeyDown: boolean = false;
  isCtrlKeyDown: boolean = false;

  dragSourceElement: any;
  dragSourceItem: MenuItem;
  dragState: MenuState;


  constructor() { }


  ngOnInit(): void {
    [this.available, this.selected] = this._mapData(this.data);
    this._emitActionChangeEvent();

    this._initControl();

  }

  ngAfterViewInit() {
    this._initTemplate();
  }


  ngOnChanges({ data }): void {
    if (data) {
      const { currentValue } = data;
      [this.available, this.selected] = this._mapData(currentValue);
      this._emitActionChangeEvent();
    }

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

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      // shift key DOWN
      case SpecialKey.shift:
        event.preventDefault();
        this.isShiftKeyDown = true;
        break;

      case (SpecialKey.command):
      case (SpecialKey.ctrl):
        // command, control key DOWN
        event.preventDefault();
        this.isCtrlKeyDown = true;
        break;
    }
  }


  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    switch (event.key) {
      // shift key UP
      case SpecialKey.shift:
        event.preventDefault();
        this.isShiftKeyDown = false;
        break;

      case (SpecialKey.command):
      case (SpecialKey.ctrl):
        // command, control key UP
        event.preventDefault();
        this.isCtrlKeyDown = false;
        break;
    }
  }

  /**
   * drag 시작 시 호출되는 함수
   * @param event 드래그 하고 있는 item
   * @param item 
   * @param state 
   */
  onDragStart(event: DragEvent, item: MenuItem, state: string) {
    this.dragSourceElement = event.target;
    this.dragSourceItem = item;
    this.dragState = MenuState[state];

    this.dragSourceElement.style.opacity = '0.4';

    event.dataTransfer.effectAllowed = 'move';
  }

  /**
   * drag 가능 아이템에 마우스를 대고있으면 계속 호출되는 함수
   * @param event 다른 item
   */
  onDragOver(event: DragEvent, item: MenuItem, state: string) {
    if (this.dragState !== MenuState[state]) return false;

    if (event.preventDefault) {
      event.preventDefault();
    }

    event.dataTransfer.dropEffect = 'move';

    return false;
  }

  /**
   * 다른 item 위에 들어가면, !단 한번만! 호출되는 함수
   * @param event 다른 item
   */
  onDragEnter(event: DragEvent, item: MenuItem, state: string) {
    if (this.dragState !== MenuState[state]) return false;

    const otherNode = <HTMLElement>event.target;
    otherNode.classList.add('over');
  }


  /**
   * drag 포커스가 떠날 때 한 번 호출되는 함수
   * @param event 다른 item
   */
  onDragLeave(event: DragEvent, item: MenuItem, state: string) {
    if (this.dragState !== MenuState[state]) return false;

    const otherNode = <HTMLElement>event.target;
    otherNode.classList.remove('over');

  }

  /**
   * 다른 item에 떨어뜨리면 호출되는 함수
   * @param event 다른 item
   */
  onDrop(event: DragEvent, otherItem: MenuItem, state: string) {
    const otherElement = <HTMLElement>event.target;

    if (this.dragState !== MenuState[state]) return false;
    if (!otherElement.classList.contains('list__item')) return false;


    if (event.stopPropagation) {
      event.stopPropagation(); // stops the browser from redirecting.
    }


    if (this.dragSourceElement !== this) {
      let sourceOrdinal, otherOrdinal;

      switch (MenuState[state]) {
        case 0:
          // Available
          sourceOrdinal = this.dragSourceItem.ordinal;
          otherOrdinal = otherItem.ordinal;

          [this.available[sourceOrdinal].ordinal, this.available[otherOrdinal].ordinal] =
            [this.available[otherOrdinal].ordinal, this.available[sourceOrdinal].ordinal]

          break;

        case 1:
          // Selected
          sourceOrdinal = this.dragSourceItem.ordinal;
          otherOrdinal = otherItem.ordinal;

          [this.selected[sourceOrdinal].ordinal, this.selected[otherOrdinal].ordinal] =
            [this.selected[otherOrdinal].ordinal, this.selected[sourceOrdinal].ordinal]

          break;
      }
    }

    return false;

  }

  /**
   * 뭐가 되었든, 드래그가 끝나면 호출되는 item
   * @param event 현재 item
   */
  onDragEnd(event: DragEvent, item: MenuItem, state: string) {
    if (this.dragState !== MenuState[state]) return false;

    switch (MenuState[state]) {
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

  /**
 * visible, invisible 여부에 따라 ordinal을 초기화해주는 함수
 * @param {MenuItem[]} data 기존의 데이터
 * @returns {MenuItem[]} 바뀐 형식의 데이터
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


  private _initTemplate() {
    this.available.map(item => item.template = this.templateEmojiText);
    this.selected.map(item => item.template = this.templateEmojiText);
  }

  /**
   * id가 없으면 focused에 넣고, 있으면 focused에서 빼기
   * @param {number} id 
   */
  private _toggleIdFocused(id: number, state: MenuState) {
    if (!this.focused.includes(id)) {
      this.focused.push(id);

      switch (state) {
        case MenuState.available:
          this.availableFocusedCount++;
          break;

        case MenuState.selected:
          this.selectedFocusedCount++;
          break;
      }

    } else {
      this.focused = this.focused.filter(focusId => focusId !== id);
      switch (state) {
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
  private _pushToFocused(id: number, state: MenuState) {
    if (!this.focused.includes(id)) {
      this.focused.push(id);

      switch (state) {
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
      available: this.available.reduce(reducer, [])
    });

  }

  private _focusedInit(list: MenuItem[], v: boolean): void {
    for (let i = 0; i < list.length; i++) {
      list[i].focused = v;
    }
  }


  getAvailable() {
    const ret = [];

    this.available
      .sort((itemA, itemB) => itemA.ordinal - itemB.ordinal)
      .forEach(item => {
        if (item.name.includes(this.controls.availableSearch.keyword))
          ret.push(item)
      })

    return ret;
  }


  getSelected() {
    const ret = [];


    this.selected
      .sort((itemA, itemB) => itemA.ordinal - itemB.ordinal)
      .forEach(item => {
        if (item.name.includes(this.controls.selectedSearch.keyword))
          ret.push(item)
      })


    return ret;
  }



  onSelect(state: string, item: MenuItem): void {
    const { id } = item;

    if (!this.optionStateActive.moveOne ||
      this.optionStateActive.moveOne && this.isShiftKeyDown ||
      this.optionStateActive.moveOne && this.isCtrlKeyDown
    ) {
      this._toggleIdFocused(id, MenuState[state]);

      switch (MenuState[state]) {
        case 0:
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

        case 1:
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


      if (this.isShiftKeyDown) {
        let list: number[], from: number, to: number;
        switch (MenuState[state]) {
          case 0:
            list = this.focused.map(focusedItemId => (
              this.available.findIndex(({ id }) => id === focusedItemId)
            ))

            from = Math.min(...list);
            to = Math.max(...list);

            if (from !== Infinity && to !== -Infinity) {
              for (let i = from; i <= to; i++) {
                this.available[i].focused = true;
                this._pushToFocused(this.available[i].id, MenuState[state]);
              }
            } else {
              this.isShiftKeyDown = false;
            }
            break;

          case 1:
            list = this.focused.map(focusedItemId => (
              this.selected.findIndex(({ id }) => id === focusedItemId)
            ))

            from = Math.min(...list);
            to = Math.max(...list);

            if (from !== Infinity && to !== -Infinity) {
              for (let i = from; i <= to; i++) {
                this.selected[i].focused = true;
                this._pushToFocused(this.selected[i].id, MenuState[state]);
              }
            } else {
              this.isShiftKeyDown = false;
            }
            break;
        }

      } else if (
        !this.optionStateActive.moveOne ||
        this.optionStateActive.moveOne && this.isCtrlKeyDown
      ) {
        switch (MenuState[state]) {
          case 0:
            this._toggleFocus(this.available, id);
            break;

          case 1:
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
            this.actionStateActive = {
              ...this.actionStateActive,
              toAvailable: false,
              toSelected: true,
            };
            break;

          case MenuState.selected:
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
      this.focused = [];
      switch (MenuState[state]) {
        case 0:
          this.availableFocusedCount = 0;
          this.selectedFocusedCount = 0;
          this._clearFocused(this.available);
          this._clearFocused(this.selected);
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
          this._clearFocused(this.available);
          this._clearFocused(this.selected);
          this._toggleFocus(this.selected, id);
          this.actionStateActive = {
            ...this.actionStateActive,
            toAvailable: true,
            toSelected: false,
          };
          break;
      }
      this._toggleIdFocused(id, MenuState[state]);

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
    this.reset.emit();
    setTimeout(() => {
      this._initTemplate();
    }, 0);
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

}

