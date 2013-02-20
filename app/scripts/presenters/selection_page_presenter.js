/*
 * S2 - An open source lab information management systems (LIMS)
 * Copyright (C) 2013  Wellcome Trust Sanger Insitute
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 1, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston MA  02110-1301 USA
 */


define(['views/selection_page_view'], function(SelectionPageView) {

  var SelectionPagePresenter = function(owner) {
    /* constructor
     *
     * Arguments
     * ---------
     * owner : the owner of this presenter. Expected to be the application controller
     */
    this.owner = owner;
    this.model = undefined;
    this.view = undefined;
  }

  SelectionPagePresenter.prototype.init = function(selection) {
    /* initialises this instance by instantiating the view
     */
    this.view = new SelectionPageView(this, selection);
  }

  SelectionPagePresenter.prototype.update = function(model) {
    /* Updates the data for the current view
     *
     * Tells the presenter that the model has been updated, giving
     * the current value of the model.
     *
     * Arguments
     * ---------
     * model. The model to update.
     */
    if (this.view) {
      this.view.clear();
      this.view.render(model);
    }
  }

  SelectionPagePresenter.prototype.release = function() {
    /* Tells the presnter to get ready for being deleted.
     *
     * This should only be called at the end of the life. It will
     * tell the view component to tell itself to disappear from the 
     * open page.
     */
    this.view.clear();
  }

  SelectionPagePresenter.prototype.childDone = function(presenter, action, data) {
    /* Handles done messages from the page view and child presenters.
     *
     * Any messages that happen to come from the PageView will be delegated over to
     * selfDone.
     *
     * Arguments
     * ---------
     * presenter : the presenter instance the done message is coming from. Can be
     *             either the PagePresenter or one of the PartialPresenters
     * action:     a string representing the action request, e.g. 'next' for someone
     *             clicking on the next button
     * data:       Any data associated with the action.
     * 
     */
    if (presenter === this) {
      this.selfDone(action, data);
      }
  }

  SelectionPagePresenter.prototype.selfDone = function(action, data) {
    /* Handles done messages that arose from within this class or the view
     *
     * Arguments
     * ---------
     * presenter : the presenter instance the done message is coming from. Can be
     *             either the PagePresenter or one of the PartialPresenters
     * action:     a string representing the action request, e.g. 'next' for someone
     *             clicking on the next button
     * data:       Any data associated with the action.
     * 
     */
    if (action == "next") {
      this.owner.childDone(this, action, data);
      }
    }
  
  return SelectionPagePresenter;
});
