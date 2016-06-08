<div class="form-group">
  <label class="form-label" for="newsletter-group">Send to Group</label>
  <select class="form-control" id="newsletter-group">
    <option value="everyone">Everyone</option>
    <option value="administrators">Administrators</option>
    <!-- BEGIN groups -->
    <option value="{groups.name}">{groups.name}</option>
    <!-- END groups -->
  </select>
</div>
