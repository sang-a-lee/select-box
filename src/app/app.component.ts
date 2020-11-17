import { Component } from '@angular/core';
import { menus, users } from '../resource/data';

import { MenuItem } from './dual-selector/dual-selector.component';

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

  ngOnInit(): void {
    this.initData();
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
    /* menus */
    this.original = [...menus];
    menus.forEach(json => {
      const item = MenuItem.parse(json);
      //
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
