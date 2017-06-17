<p>
<div class="form-group">
  <label class="form-label" for="newsletter-group">Send newsletter to these groups.</label>
  <label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="checkbox-everyone">
    <input type="checkbox" id="checkbox-everyone" class="mdl-switch__input">
    <span class="mdl-switch__label">Everyone</span>
  </label>
  <div id="custom-groups">
    <!-- BEGIN groups -->
    <label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="checkbox-{groups.name}">
      <input type="checkbox" id="checkbox-{groups.name}" class="mdl-switch__input">
      <span class="mdl-switch__label">{groups.name}</span>
    </label>
    <!-- END groups -->
  </div>
</div>
