from flask import Blueprint, render_template, redirect, url_for
from flask_login import login_required, current_user
from flask import session, jsonify, request
from .sf_utility import SalesforceConnector


main = Blueprint('main', __name__)


def fetch_fields(object_name):
    account_fields = [
        {"fieldLabel": "Account ID", "fieldApiName": "Id"},
        {"fieldLabel": "Type", "fieldApiName": "Type"},
        {"fieldLabel": "Account Name", "fieldApiName": "Name"},
        {"fieldLabel": "Phone", "fieldApiName": "Phone"}
    ]
    contact_fields = [
        {"fieldLabel": "Contact ID", "fieldApiName": "Id"},
        {"fieldLabel": "Contact Name", "fieldApiName": "Name"},
        {"fieldLabel": "Phone", "fieldApiName": "Phone"},
        {"fieldLabel": "Email", "fieldApiName": "Email"}
    ]
    if 'Account' not in session:
        session['Account'] = account_fields

    if 'Contact' not in session:
        session['Contact'] = contact_fields
    
    return session['Account'] if object_name == 'Account' else session['Contact']

def get_sf_instance():
    sf = SalesforceConnector(
        session=session.get('session_code', ''),
        instance=session.get('instance', '')
    )
    return sf




@main.route('/api/get_fields/<object_name>', methods=['GET'])
@login_required
def get_fields(object_name):
    sf = get_sf_instance()
    current_fields = fetch_fields(object_name)
    data = sf.query_fields(object_name, current_fields)
    return jsonify(data)

@main.route('/api/update_fields/<object_name>', methods=['POST'])
@login_required
def update_fields(object_name):
    fields = request.json
    session[object_name] = fields
    return jsonify({"message": "Fields updated successfully!"})

@main.route('/api/get_data/<object_name>', methods=['GET'])
@login_required
def get_data(object_name):
    sf = get_sf_instance()
    
    fields = fetch_fields(object_name)
    records = sf.query_object(object_api_name=object_name, fields=fields)
    return jsonify({
        'fields': fields,
        'records': records
    })

@main.route('/api/search_records', methods=['GET'])
@login_required
def search_records():
    sf = get_sf_instance()
    name = request.args.get('q', '')
    objectName = request.args.get('objectname', '')

    records = sf.search_record(objectName, name)

    response_data = [
        {
            'id': record['Id'], 
            'name': record['Name'], 
            'description': f"Account • {record['BillingCity']}, {record['BillingState']}"
        } 
        for record in records
    ]

    return jsonify(response_data)

@main.route('/api/create_record', methods=['POST'])
@login_required
def create_record():
    
    try:
        sf = get_sf_instance()
        data = request.json
        object_name = data.get('objectName')
        fields = data.get('fields')
        
        result = sf.create_record(object_name, fields)
        print(result.get('message'))
        status = 200 if result.get('status_custom') == 'success' else 400
        return jsonify(result), status

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@main.route("/main")
@login_required
def main_page():
    login_data = session.get('login_data', {})
    sf = get_sf_instance()
    
    user_data = sf.get_user_details(login_data['username'])

    menu_items = [
        {"title": "Account", "apiName": "Account", "current": False},
        {"title": "Contact", "apiName": "Contact", "current": True}
    ]
    return render_template('main.html', user_data=user_data, menu_items=menu_items)
