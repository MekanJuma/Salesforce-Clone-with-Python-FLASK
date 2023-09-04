from simple_salesforce import Salesforce


class SalesforceConnector:
    def __init__(self, instance, session) -> None:
        self.default_limit = 50
        
        self.sf = Salesforce(instance=instance, session_id=session, version='58.0')

    def get_user_details(self, username):
        result = self.sf.query(f"SELECT FirstName, LastName, Email FROM User WHERE Username = '{username}'")
        if result['records']:
            data = {}
            data['firstname'] = result['records'][0]['FirstName']
            data['lastname'] = result['records'][0]['LastName']
            data['email'] = result['records'][0]['Email']
            return data
        return None

    def query_object(self, object_api_name, fields):
        field_api_names = [item['fieldApiName'] for item in fields]
        fields_string = ', '.join(field_api_names)
        query = f"SELECT {fields_string} FROM {object_api_name} LIMIT {self.default_limit}"
        result = self.sf.query(query)

        return result['records']
    
    def query_fields(self, object_api_name, current_fields):
        describe_results = self.sf.__getattr__(object_api_name).describe()
        fields_list = [{'label': field['label'], 'id': field['name']} for field in describe_results['fields']]
        
        field_api_names = [item['fieldApiName'] for item in current_fields]
        
        visible_fields = [{'id': field['fieldApiName'], 'label': field['fieldLabel']} for field in current_fields]
        available_fields = [field for field in fields_list if field['id'] not in field_api_names]

        final = {
            'visible_fields': visible_fields,
            'available_fields': sorted(available_fields, key=lambda x: x['label'])
        }

        return final
    
    def search_record(self, object_api_name, name):
        query = f"SELECT Id, Name, BillingCity, BillingState FROM Account WHERE Name LIKE '%{name}%' LIMIT 4"
        result = self.sf.query(query)
        return result['records']

    def create_record(self, object_api_name, fields):
        try:
            result = self.sf.__getattr__(object_api_name).create(fields)
            
            if result and result.get('success'):
                return {'status_custom': 'success', 'message': 'Record created successfully!', 'id': result.get('id')}
            elif result.get('errorCode') == 'DUPLICATES_DETECTED':
                return {'status_custom': 'warning', 'message': 'Potential duplicate detected. Use one of the existing records or continue with the current operation.'}
            else:
                return {'status_custom': 'failure', 'message': 'Failed to create record.'}
        
        except Exception as e:
            return {'status_custom': 'error', 'message': str(e)}

