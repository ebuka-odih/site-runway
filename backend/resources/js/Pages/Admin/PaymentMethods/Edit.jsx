import AdminLayout from '@/Layouts/AdminLayout';
import PaymentMethodForm from '@/Pages/Admin/PaymentMethods/PaymentMethodForm';
import { adminPath } from '@/lib/adminPath';
import { useForm, usePage } from '@inertiajs/react';

export default function Edit({ method, options }) {
    const { url } = usePage();
    const form = useForm({
        name: method.name || '',
        channel: method.channel || (options.channels[0] || 'bank_transfer'),
        currency: method.currency || 'USD',
        network: method.network || '',
        wallet_address: method.wallet_address || '',
        bank_name: method.bank_details?.bank_name || '',
        account_name: method.bank_details?.account_name || '',
        account_number: method.bank_details?.account_number || '',
        routing_number: method.bank_details?.routing_number || '',
        swift_code: method.bank_details?.swift_code || '',
        bank_address: method.bank_details?.bank_address || '',
        reference_letter: method.bank_details?.reference_letter || '',
        status: method.status || 'active',
        description: method.description || '',
        display_order: Number(method.display_order || 0),
    });

    const submit = (event) => {
        event.preventDefault();
        form.put(adminPath(url, `payment-methods/${method.id}`));
    };

    return (
        <AdminLayout title="Edit Payment Method">
            <PaymentMethodForm
                form={form}
                options={options}
                heading={`Edit ${method.name}`}
                description="Update payment method details and operational settings."
                submitLabel="Save Changes"
                onSubmit={submit}
                cancelHref={adminPath(url, 'payment-methods')}
            />
        </AdminLayout>
    );
}
