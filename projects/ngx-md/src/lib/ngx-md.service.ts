import { Injectable, SecurityContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { throwError, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DomSanitizer } from '@angular/platform-browser';
import MarkdownIt from 'markdown-it';
import MarkdownItFootnote from 'markdown-it-footnote';

@Injectable({
  providedIn: 'root'
})
export class NgxMdService {
  private _renderer: any = MarkdownIt({ linkify: true }).use(MarkdownItFootnote);

  constructor(
    private _http: HttpClient,
    private _domSanitizer: DomSanitizer
  ) {
    // Remember old renderer, if overriden, or proxy to default renderer
    var defaultRender = this._renderer.renderer.rules.link_open || function(tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options);
    };
    this._renderer.renderer.rules.link_open = function (tokens, idx, options, env, self) {
      var aIndex = tokens[idx].attrIndex('target');

      if (aIndex < 0) {
        tokens[idx].attrPush(['target', '_blank']);
      } else {
        tokens[idx].attrs[aIndex][1] = '_blank';
      }

      return defaultRender(tokens, idx, options, env, self);
    };
    this.setMarkedOptions({});
  }

  // get the content from remote resource
  getContent(path: string): Observable<any> {
    return this._http.get(path, {responseType: 'text'})
    .pipe(
      map(res => this.extractData(res)),
      catchError(this.handleError)
    );
  }

  public setMarkedOptions(options: any) {
    options = Object.assign({
      gfm: true,
      tables: true,
      breaks: false,
      pedantic: false,
      sanitize: false,
      smartLists: true,
      smartypants: false
    }, options);
    // TODO
  }

  // comple markdown to html
  public compile(data: string) {
     return this._renderer.render(data);
  }

  // handle error
  private handleError(error: any): any {
    let errMsg: string;
    if (error instanceof fetch) {
      const body = error.json() || '';
      const err = body.error || JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    return throwError(errMsg);
  }
}

