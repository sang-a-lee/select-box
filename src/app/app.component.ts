import { Component, SimpleChange } from '@angular/core';
import { menus } from '../resource/data';

interface Event {
  command: string;
  available: [];
  selected: [];
}

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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent {
  title = 'issue877';
  menuItems = [];
  available: [];
  selected: [];

  listenerAction($event: Event): void {
    const { available, selected } = $event;

    this.available = available;
    this.selected = selected;
  }

  listenerReset($event): void {
    console.log('초기화 버튼 눌림');
    this.menuItems = [];
    console.log(this.menuItems);
  }

  initData(): void {
    this.menuItems = [];
    menus.forEach(json => {
      const item = MenuItem.parse(json);
      this.menuItems.push(item);
    });
    this.available = [];
    this.selected = [];
  }

  ngOnInit(): void {
    this.initData();
    console.log(this.menuItems);
  }
}
