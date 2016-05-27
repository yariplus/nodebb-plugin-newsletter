<div class="composer" component="composer" id="cmp-uuid-newsletter">
<div id="newsletter">
    <h1><i class="fa fa-fw fa-newspaper-o"></i>Newsletter</h1>
    <div class="row">
        <div class="form-group col-md-6">
            <label class="form-label" for="newsletter-subject">Subject</label>
            <input class="form-control" id="newsletter-subject" type="text"/>
        </div>
    </div>
	<div class="checkbox">
		<label for="raw">
			<input id="raw" type="checkbox">
			Parse raw HTML.
		</label>
	</div>
    <div class="btn-toolbar formatting-bar row">
        <div class="form-group col-md-6">
            <label class="form-label" for="newsletter-template">Body</label><span> ( Parsed as a Post, and you can use &#123;username&#125; )</span>
        </div>
        <div class="form-group col-md-6">
            <label class="form-label" for="newsletter-preview">Preview</label>
        </div>
        <div class="btn-group col-sm-12">
			<span class="btn btn-link" tabindex="-1" data-format="bold" title="[[modules:composer.formatting.bold]]"><i class="fa fa-bold"></i></span>
			<span class="btn btn-link" tabindex="-1" data-format="italic" title="[[modules:composer.formatting.italic]]"><i class="fa fa-italic"></i></span>
			<span class="btn btn-link" tabindex="-1" data-format="list" title="[[modules:composer.formatting.list]]"><i class="fa fa-list"></i></span>
			<span class="btn btn-link" tabindex="-1" data-format="strikethrough" title="[[modules:composer.formatting.strikethrough]]"><i class="fa fa-strikethrough"></i></span>
			<span class="btn btn-link" tabindex="-1" data-format="link" title="[[modules:composer.formatting.link]]"><i class="fa fa-link"></i></span>
			<span class="btn btn-link" tabindex="-1" data-format="picture-o" title="[[modules:composer.formatting.picture]]"><i class="fa fa-picture-o"></i></span>
            <span class="btn btn-link img-upload-btn hide" data-format="picture" tabindex="-1" title="[[modules:composer.upload-picture]]"><i class="fa fa-cloud-upload"></i></span>
            <span class="btn btn-link file-upload-btn hide" data-format="upload" tabindex="-1" title="[[modules:composer.upload-file]]"><i class="fa fa-upload"></i></span>
            <form id="fileForm" method="post" enctype="multipart/form-data">
				<!--[if gte IE 9]><!-->
					<input type="file" id="files" name="files[]" multiple class="gte-ie9 hide"/>
				<!--<![endif]-->
				<!--[if lt IE 9]>
					<input type="file" id="files" name="files[]" class="lt-ie9 hide" value="Upload"/>
				<![endif]-->
			</form>
        </div>
    </div>
    <div class="row">
        <div class="form-group col-md-6">
            <textarea class="form-control" id="newsletter-template"></textarea>
        </div>
        <div class="form-group col-md-6">
            <div class="form-control preview" id="newsletter-preview"></div>
        </div>
    </div>
    <div class="row">
        <div class="form-group col-md-6">
            <label class="form-label" for="newsletter-group">Send to Group</label>
            <select class="form-control" id="newsletter-group">
                <option value="everyone">Everyone</option>
                <option value="administrators">Administrators</option>
                <!-- BEGIN groups -->
                <option value="{groups.name}">{groups.name}</option>
                <!-- END groups -->
            </select>
        </div>
    </div>
    <div class="row">
        <div class="form-group col-md-6">
            <button class="btn btn-success" type="button" id="newsletter-send"><i class="fa fa-fw fa-newspaper-o"></i> Send Newsletter</input>
        </div>
    </div>
</div>
</div>
