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
  private _renderer: any = MarkdownIt({ linkify: true, html: true }).use(MarkdownItFootnote);

  constructor(
    private _http: HttpClient,
    private _domSanitizer: DomSanitizer
  ) {
    this.extendRenderer();
    this.setMarkedOptions({});
  }

  // get the content from remote resource
  getContent(path: string): Observable<any> {
    return this._http.get(path, {responseType: 'text'})
    .pipe(
      map(res => res),
      catchError(this.handleError)
    );
  }

  public get renderer(): any {
    return this._renderer;
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

  // add plugin
  public loadPlugin(plugin, ...opts) {
    this._renderer = this._renderer.use(plugin, ...opts);
    return this;
  }

  // extend marked render to support footnote
  private extendRenderer() {
    // for angular routeer, add prefix location.href without fragment
    const currentPageLinkWithoutHash = location.origin + location.pathname + location.search;
    this._renderer.renderer.rules.footnote_ref = function render_footnote_ref(tokens, idx, options, env, slf) {
      var id      = slf.rules.footnote_anchor_name(tokens, idx, options, env, slf);
      var caption = slf.rules.footnote_caption(tokens, idx, options, env, slf);
      var refid   = id;

      if (tokens[idx].meta.subId > 0) {
        refid += ':' + tokens[idx].meta.subId;
      }

      return '<sup class="footnote-ref"><a href="' + currentPageLinkWithoutHash + '#fn' + id + '" id="fnref' + refid + '">' + caption + '</a></sup>';
    }
    this._renderer.renderer.rules.footnote_anchor = function render_footnote_anchor(tokens, idx, options, env, slf) {
      var id = slf.rules.footnote_anchor_name(tokens, idx, options, env, slf);

      if (tokens[idx].meta.subId > 0) {
        id += ':' + tokens[idx].meta.subId;
      }

      /* ↩ with escape code to prevent display as Apple Emoji on iOS */
      return ' <a href="' + currentPageLinkWithoutHash + '#fnref' + id + '" class="footnote-backref">\u21a9\uFE0E</a>';
    }
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

