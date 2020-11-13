import { Component } from '@angular/core';
import { sample1 } from '../resource/data';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'issue877';
  data1 = sample1;
}
