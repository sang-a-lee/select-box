/* TODO
 * 데이터 바인딩 사용해서 외부에서 sample data를 가공해서 넣기 (✔️)
 * 두가지 이상의 데이터를 dual-selector에서 작동시킬수 있게 하기 (✔️)
 * addAll, add, remove, removeAll 에 대해서 이벤트 발생 시키기 (상위 컴포넌트) (✔️)
 * 이벤트가 발생할 때 인자로 selected된 데이터를 같이 넘겨야 함 (✔️)
 * 상위 컴포넌트에서는 dual-selector 에서 전달한 데이터를 json pipe를 사용해서 표시하기 (✔️)
 * scss -> less (✔️)
 * 아이템 순서 이동 (✔️)
 */

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

interface Item {
  id: number;
  topId: number;
  code: string;
  name: string;
  nameEn: string;
  nameKo: string;
  route: string;
  ordinal: number;
  visible: boolean;
  focused: boolean;
}

@Component({
  selector: 'app-dual-selector',
  templateUrl: './dual-selector.component.html',
  styleUrls: ['./dual-selector.component.less'],
})
export class DualSelectorComponent implements OnInit {
  @Input() data: Item[];
  @Output() clickEvent = new EventEmitter();

  available: Item[] = [];
  selected: Item[] = [];
  focuses = []; // 중복 시, 아이템 삭제

  constructor() {}

  /**
   * 인자로 받은 list(available || selected) 의 ordinal을 재정렬 하는 함수
   * @param {Item[]} list ordinal을 재정렬할 배열
   */
  arrangeOrdinal(list: Item[]): void {
    for (let i = 0; i < list.length; i++) {
      list[i].ordinal = i;
    }
  }

  /**
   * selected 로 선택된 것들을 옮기는 함수.
   */
  toSelected(): void {
    const ret = [];

    // available -> selected
    this.focuses.forEach(focusId => {
      const item = this.available.filter(({ id }) => id === focusId)[0];
      item.visible = true;
      item.focused = false;
      ret.push(item);
    });

    this.selected = [...this.selected, ...ret];
    this.arrangeOrdinal(this.selected);

    // focuses에 남아있는 available 삭제
    this.available = this.available.filter(
      ({ id }) => !this.focuses.includes(id)
    );

    // ordinal 재정렬
    this.arrangeOrdinal(this.available);

    // 초기화
    this.focuses = [];

    // event 전달
    this.clickEvent.emit({
      command: 'to-selected',
      available: this.available,
      selected: this.selected,
    });
  }

  /**
   * selected 로 모두 옮기는 함수.
   */
  toSelectedAll(): void {
    const ret = [];

    // available -> selected
    this.available.forEach(item => {
      item.visible = true;
      item.focused = false;
      ret.push(item);
    });

    // ordinal 재정렬
    this.selected = [...this.selected, ...ret];
    this.arrangeOrdinal(this.selected);

    // 초기화
    this.available = [];
    this.focuses = [];

    // event 전달
    this.clickEvent.emit({
      command: 'to-selected-all',
      available: this.available,
      selected: this.selected,
    });
  }

  /**
   * available 로 선택된 것들을 옮기는 함수.
   */
  toAvailable(): void {
    const ret = [];

    // selected -> available
    this.focuses.forEach(focusId => {
      const item = this.selected.filter(({ id }) => id === focusId)[0];
      item.visible = false;
      item.focused = false;
      ret.push(item);
    });

    this.available = [...this.available, ...ret];
    this.arrangeOrdinal(this.available);

    // focuses에 남아있는 selected 삭제
    this.selected = this.selected.filter(
      ({ id }) => !this.focuses.includes(id)
    );

    // ordinal 재정렬
    this.arrangeOrdinal(this.selected);

    // 초기화
    this.focuses = [];

    // event 전달
    this.clickEvent.emit({
      command: 'to-available',
      available: this.available,
      selected: this.selected,
    });
  }

  /**
   * available 로 모두 옮기는 함수.
   */ toAvailableAll(): void {
    const ret = [];

    // selected -> available
    this.selected.forEach(item => {
      item.visible = true;
      item.focused = false;
      ret.push(item);
    });

    // ordinal 재정렬
    this.available = [...this.available, ...ret];
    this.arrangeOrdinal(this.available);

    // 초기화
    this.selected = [];
    this.focuses = [];

    // event 전달
    this.clickEvent.emit({
      command: 'to-available-all',
      available: this.available,
      selected: this.selected,
    });
  }

  /**
   * 임의의 item을 클릭하면 this.focused에 넣어주고, focused 속성을 바꿔주는 함수.
   * (focused -> T 이면 리스트 아이템의 색이 파란색으로,
   * focused -> F 이면 리스트 아이템의 색이 흰색이 된다)
   * @param {string} position 현재 선택된 아이템이 available인지, selected인지.
   * @param {Item} item 클릭한 item
   */
  onSelect(position: string, item: Item): void {
    const { id } = item;
    if (this.focuses.includes(id)) {
      this.focuses = this.focuses.filter(focusId => focusId !== id);
    } else {
      this.focuses.push(id);
    }

    switch (position) {
      case 'available':
        this.available.map(availableItem =>
          availableItem.id === id
            ? (availableItem.focused = !availableItem.focused)
            : availableItem
        );
        break;

      case 'selected':
        this.selected.map(selectedItem =>
          selectedItem.id === id
            ? (selectedItem.focused = !selectedItem.focused)
            : selectedItem
        );
        break;
    }
  }

  toUp(): void {
    const currItemId = this.focuses[0];

    if (!currItemId) {
      return;
    }

    const { length } = this.selected;

    for (let i = 0; i < length; i++) {
      const item = this.selected[i];
      if (item.id === currItemId) {
        if (i === 0) {
          return;
        }
        this._swap(this.selected, i, i - 1);
        break;
      }
    }

    this.focuses = [];
    this.selected.map(selectedItem => (selectedItem.focused = false));
  }

  toDown(): void {
    const currItemId = this.focuses[0];
    if (!currItemId) {
      return;
    }

    const { length } = this.selected;

    for (let i = 0; i < length; i++) {
      const item = this.selected[i];
      if (item.id === currItemId) {
        if (i === length - 1) {
          return;
        }
        this._swap(this.selected, i, i + 1);
        break;
      }
    }

    this.focuses = [];
    this.selected.map(selectedItem => (selectedItem.focused = false));
  }

  _swap(list: Item[], idx1: number, idx2: number): void {
    [list[idx1], list[idx2]] = [list[idx2], list[idx1]];
    list[idx1].ordinal = idx1;
    list[idx2].ordinal = idx2;
  }

  /**
   * 형태가 다른 데이터가 들어올 경우, 형식을 맞춰주는 함수.
   * @param {Item[]} data 기존의 데이터
   * @param {any} names 매핑할 키의 쌍들
   * @returns {Item[]} 바뀐 형식의 데이터
   */
  _mapData(data: Item[], names: any): Item[] {
    const ret = [];
    const { length } = data;

    for (let i = 0; i < length; i++) {
      const item = data[i];
      item.focused = false;
      item.id = i;
      item.ordinal = i;
      item.name = item[names.name];
      ret.push(item);
    }

    return ret;
  }

  ngOnInit(): void {
    // this.available = [
    //   ...this._mapData(this.data, {
    //     name: 'name',
    //   }),
    // ];

    this.available = [
      ...this._mapData(this.data, {
        name: 'roleName',
      }),
    ];
  }
}
