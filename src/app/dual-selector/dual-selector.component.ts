import { Component, OnInit, HostListener } from '@angular/core';
import { sample1 } from '../../resource/data';

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
}

enum KEY_CODE {
  UP_ARROW = 38,
  DOWN_ARROW = 40,
  RIGHT_ARROW = 39,
  LEFT_ARROW = 37,
}

@Component({
  selector: 'app-dual-selector',
  templateUrl: './dual-selector.component.html',
  styleUrls: ['./dual-selector.component.scss'],
})
export class DualSelectorComponent implements OnInit {
  data: Item[];
  focused = new Set();

  constructor() {}

  // 버튼(add, add-all, remove, remove-all)을 클릭하면 그에 따른 작업을 하는 함수.
  // add와 remove는 focused된 버튼만 visible 속성을 변경하고,
  // add-all과 remove-all은 모두 옮기는 것 이므로 data에 있는 모든 item들의 visible 속성을 변경한다
  execute(command: string): void {
    switch (command) {
      case 'add':
        this.data.map(item =>
          this.focused.has(item.id) ? (item.visible = true) : item
        );
        break;

      case 'add-all':
        this.data.map(item => (item.visible = true));
        break;

      case 'remove':
        this.data.map(item =>
          this.focused.has(item.id) ? (item.visible = false) : item
        );
        break;

      case 'remove-all':
        this.data.map(item => (item.visible = false));
        break;
    }

    this.focused = new Set();
    this.initDataOrdinal();
  }

  // 임의의 item을 클릭하면, this.focused에 넣어주는 함수.
  onSelect($event: MouseEvent, item: Item): void {
    console.dir($event);
    // const { target } = $event;
    const { id } = item;
    this.focused.add(id);
  }

  // visible 속성 값에 따라, ordinal 값을 정해주는 함수.
  initDataOrdinal(): void {
    let visibleIdx = 0;
    let unvisibleIdx = 0;
    const length = sample1.length;

    for (let i = 0; i < length; i++) {
      const item = sample1[i];
      let idx;

      if (item.visible) {
        idx = visibleIdx;
        visibleIdx++;
      } else {
        idx = unvisibleIdx;
        unvisibleIdx++;
      }

      item.ordinal = idx;
    }
    console.log(this.data);
  }

  ngOnInit(): void {
    this.data = [...sample1];
    this.initDataOrdinal();
  }
}
