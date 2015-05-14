<form id="audio-control" class="col-lg-9 col-md-12">
    <h1><i class="fa fa-fw fa-newspaper-o"></i>Newsletter</h1>
    <div class="form-group">
        <label class="form-label" for="newsletter-subject">Subject</label>
        <input class="form-control" id="newsletter-subject" type="text"/>
    </div>
    <div class="form-group">
        <label class="form-label" for="newsletter-template">Body</label><span> ( You can use &#123;username&#125; )</span>
        <textarea class="form-control" id="newsletter-template"></textarea>
    </div>
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
    <br>
    <div class="form-group">
        <button class="btn btn-success" type="button" id="newsletter-send"><i class="fa fa-fw fa-newspaper-o"></i> Send Newsletter</input>
    </div>
</form>
