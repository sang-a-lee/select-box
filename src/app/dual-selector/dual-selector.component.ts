/*
1. 데이터 바인딩 사용해서 외부에서 sample data를 가공해서 넣기 
2. bootstrap의 list-groups를 사용 (✔️)
3. add, remove 방식 변경하기 (✔️)
4. 두가지 이상의 데이터를 dual-selector에서 작동시킬수 있게 하기 (편집됨) 
*/

import { Component, OnInit, Input } from '@angular/core';

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
  styleUrls: ['./dual-selector.component.scss'],
})
export class DualSelectorComponent implements OnInit {
  @Input() data: Item[];
  available: Item[];
  selected: Item[];
  focuses = []; // 중복 시, 아이템 삭제

  constructor() {}

  arrangeOrdinal(list: Item[]): void {
    for (let i = 0; i < list.length; i++) {
      list[i].ordinal = i;
    }
  }

  // selected 로 옮김 (->)
  toSelected(): void {
    // available에 있는 아이템들 중
    // focuses의 id와 매칭시켜서
    // 해당 되는 애들은 selected로 옮기고
    // 동시에 available에서 제외

    const ret = [];

    // available -> selected
    this.focuses.forEach(focusId => {
      const item = this.available.filter(({ id }) => id === focusId)[0];
      item.visible = true;
      item.focused = false;
      ret.push(item);
    });

    this.selected = [...this.selected, ...ret];

    // ordinal 초기화
    // for (let i = 0; i < this.selected.length; i++) {
    //   this.selected[i].ordinal = i;
    // }
    this.arrangeOrdinal(this.selected);

    // available 청소
    this.available = this.available.filter(
      ({ id }) => !this.focuses.includes(id)
    );

    // for (let i = 0; i < this.available.length; i++) {
    //   this.available[i].ordinal = i;
    // }
    this.arrangeOrdinal(this.available);

    // 초기화
    this.focuses = [];
  }

  // selected 로 옮김 (->)
  toSelectedAll(): void {
    const ret = [];

    // available -> selected
    this.available.forEach(item => {
      item.visible = true;
      item.focused = false;
      ret.push(item);
    });

    this.selected = [...this.selected, ...ret];

    // ordinal 초기화
    // for (let i = 0; i < this.selected.length; i++) {
    //   this.selected[i].ordinal = i;
    // }
    this.arrangeOrdinal(this.selected);

    // available 청소
    this.available = [];

    // 초기화
    this.focuses = [];
  }

  // available로 옮김 (<-)
  toAvailable(): void {
    const ret = [];

    // available -> selected
    this.focuses.forEach(focusId => {
      const item = this.selected.filter(({ id }) => id === focusId)[0];
      item.visible = false;
      item.focused = false;
      ret.push(item);
    });

    this.available = [...this.available, ...ret];

    // ordinal 초기화
    // for (let i = 0; i < this.available.length; i++) {
    //   this.available[i].ordinal = i;
    // }
    this.arrangeOrdinal(this.available);

    // selected 청소
    this.selected = this.selected.filter(
      ({ id }) => !this.focuses.includes(id)
    );

    // for (let i = 0; i < this.selected.length; i++) {
    //   this.selected[i].ordinal = i;
    // }
    this.arrangeOrdinal(this.selected);

    // 초기화
    this.focuses = [];
  }

  // available로 옮김 (<-)
  toAvailableAll(): void {
    const ret = [];

    // selected -> available
    this.selected.forEach(item => {
      item.visible = true;
      item.focused = false;
      ret.push(item);
    });

    this.available = [...this.available, ...ret];

    // ordinal 초기화
    this.arrangeOrdinal(this.available);

    // selected 청소
    this.selected = [];

    // 초기화
    this.focuses = [];
  }

  // 임의의 item을 클릭하면, this.focused에 넣어주는 함수.
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
            ? (availableItem.focused = true)
            : availableItem
        );
        break;

      case 'selected':
        this.selected.map(selectedItem =>
          selectedItem.id === id ? (selectedItem.focused = true) : selectedItem
        );
        break;
    }
  }

  ngOnInit(): void {
    this.available = [];
    this.selected = [];

    this.data.forEach((item: Item) => {
      item.focused = false;
      this.available.push(item);
    });
  }
}
