import { Component } from '@angular/core';
import { sample1, sample2 } from '../resource/data';

interface Event {
  command: string;
  available: [];
  selected: [];
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent {
  title = 'issue877';
  data1 = sample1;
  data2 = sample2;
  available: [];
  selected: [];

  listener($event: Event): void {
    const { command, available, selected } = $event;
    this.available = available;
    this.selected = selected;
  }
}
