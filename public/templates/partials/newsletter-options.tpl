  <div class="form-group">
    <label class="form-label" for="newsletter-group">Options</label>
    <label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="checkbox-override">
      <input type="checkbox" id="checkbox-override" class="mdl-switch__input">
      <span class="mdl-switch__label">Override user subscription settings?</span>
    </label>
    <label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="checkbox-blacklist">
      <input type="checkbox" id="checkbox-blacklist" class="mdl-switch__input">
      <span class="mdl-switch__label">Use email blacklist?</span>
    </label>
    <div class="form-group" id="newsletter-blacklist-form">
      <label class="form-label" for="newsletter-blacklist">Enter emails to blacklist. Comma/newline/space separated.</label>
      <textarea class="form-control" rows="5" id="newsletter-blacklist"></textarea>
    </div>
    <label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="checkbox-prefix-title">
      <input type="checkbox" id="checkbox-prefix-title" class="mdl-switch__input" checked>
      <span class="mdl-switch__label">Prefix email subject with forum title?</span>
    </label>
  </div>
