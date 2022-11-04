<div id="newsletter" class="admin">
  <h1><i class="fa fa-fw fa-newspaper-o"></i> Newsletter</h1>
  <h2><b>Sending a newsletter from this page is deprecated. Use the composer on a new topic instead.</b></h2>
  <div class="form-group">
    <label class="form-label" for="newsletter-subject">Subject</label>
    <input class="form-control" id="newsletter-subject" type="text"/>
  </div>
  <div class="form-group">
    <label class="form-label" for="newsletter-body">Body</label>
    <div id="newsletter-body"></div>
  </div>
  <!-- IMPORT partials/newsletter-groups.tpl -->
  <!-- IMPORT partials/newsletter-options.tpl -->
  <div class="form-group">
    <button class="btn btn-success" type="button" id="newsletter-send"><i class="fa fa-fw fa-newspaper-o"></i> Send Newsletter</button>
  </div>
</div>

<script src="/assets/plugins/nodebb-plugin-newsletter/tinymce/tinymce.min.js" referrerpolicy="origin"></script>

