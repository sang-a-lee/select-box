import { Component, ViewChild, TemplateRef } from '@angular/core';
import { FormControl } from "@angular/forms";

import { emojiMenus, users } from '../resource/data';
import { MenuItem } from './dual-selector/dual-selector.component';

enum ItemSize {
  xs = 'xs',
  s = 's',
  m = 'm'
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent {
  original: MenuItem[];
  title = 'issue877';
  menuItems = [];
  available: MenuItem[] = [];
  selected: MenuItem[] = [];
  mapPair: any = {
    id: 'id',
  };
  
  optionStateActive = {
    optionMenu: true,
    title: true,
    search: true,
    moveOne: true,
    showSelectedItemsCount: true
  }

  controls = {
    // available, selected 검색하는 input 창에서 사용
    availableSearch: {
      keyword: '',
      control: new FormControl()
    },
    selectedSearch: {
      keyword: '',
      control: new FormControl()
    },
    // available, selected 제목 수정하는 input 창에서 사용
    newAvailableTitle: {
      keyword: 'available options',
      control: new FormControl()
    },
    newSelectedTitle: {
      keyword: 'selected options',
      control: new FormControl()
    },
    // 세로 길이, 가로 길이 수정하는 input 창에서 사용
    newHeight: {
      height: 300,
      control: new FormControl()
    },
    newWidth: {
      width: 171,
      control: new FormControl()
    },
  }

  itemSize: string = ItemSize.s;

  @ViewChild("templateText") templateText: TemplateRef<any>;
  @ViewChild("templateEmojiText") templateEmojiText: TemplateRef<any>;

  ngOnInit(): void {
    this.initData();
  }

  onSizeChange(size: string) {
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

  onActionChanged(menuItems: {
    selected: number[];
    available: number[];
  }): void {
    const { selected, available } = menuItems;
    this.selected = [];
    this.available = [];

    selected.forEach(selectedId => {
      const { id } = this.mapPair;
      const idx = this.original.findIndex(item => item[id] === selectedId);
      const item = { ...this.original[idx] };
      delete item.ordinal;
      this.selected.push(item);
    });

    available.forEach(availableId => {
      const { id } = this.mapPair;
      const idx = this.original.findIndex(item => item[id] === availableId);
      const item = { ...this.original[idx] };
      delete item.ordinal;
      this.available.push(item);
    });
  }

  onReset(event) {
    this.initData();
  }

  initData(): void {
    this.menuItems = [];
    /* emojiMenus */
    this.original = [...emojiMenus];
    emojiMenus.forEach(json => {
      const item = MenuItem.parse(json);
      this.menuItems.push(item);
    });

    /* users */
    // this.original = [...users];
    // this.mapPair = {
    //   id: 'guid',
    //   name: 'roleName',
    // };
    // this.original.forEach(json => {
    //   const { id, name } = this.mapPair;
    //   const item = MenuItem.parse({
    //     id: json[id],
    //     ordinal: 0,
    //     visible: false,
    //     name: json[name],
    //   });
    //   this.menuItems.push(item);
    // });
  }
}
