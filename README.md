# DualSelector - 듀얼 셀렉터

듀얼 셀렉터 컴포넌트 입니다.



## 사용법

```html
<app-dual-selector 
    (updateSelectedAvailable)="onActionChanged($event)"
    (reset)="onReset($event)" 
    [data]="menuItems"
    [templateText]="templateText" 
    [templateEmojiText]="templateEmojiText"
    [controls]="controls"
    [optionStateActive]="optionStateActive" 
    [itemSize]="itemSize">
</app-dual-selector>
```



## 프로퍼티

| Name                                                    | Description                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| @Output() updateSelectedAvailable = new EventEmitter(); | selected와 available의 현재 상태를<br />상위 컴포넌트에게 전달하는 event emiiter |
| @Output() reset = new EventEmitter();                   | 초기화 버튼 클릭 시 이를<br />상위 컴포넌트에게 전달하는 event emitter |
| @Input() data                                           | data 원형                                                    |
| @Input() templateText: TemplateRef<any>;                | 템플릿                                                       |
| @Input() controls: {}                                   | 소메뉴에 대한 값 저장<br />(keyword \|\| width \|\| height, control) |
| @Input() optionStateActive: {}                          | 소메뉴의 각 아이템들<br />(타이틀 ON/OFF, 검색 ON/OFF ...)의<br />활성 상태 |
| @Input() itemSize: ItemSize;                            | 아이템의 크기 (xs, s, m)                                     |



