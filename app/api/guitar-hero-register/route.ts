import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const klaviyoApiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
    const listId = process.env.KLAVIYO_GUITAR_HERO_LIST_ID;

    if (!klaviyoApiKey || !listId) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Format phone number to E.164 format (add +1 if not present)
    let formattedPhone = phone.replace(/[^\d+]/g, '');
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+1' + formattedPhone;
    }

    // Check if phone already exists in the list
    const checkResponse = await fetch(
      `https://a.klaviyo.com/api/profiles/?filter=equals(phone_number,"${formattedPhone}")`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
          'revision': '2024-10-15',
          'Content-Type': 'application/json',
        },
      }
    );

    const checkData = await checkResponse.json();

    // If profile exists, check if they're already in the list
    if (checkData.data && checkData.data.length > 0) {
      const profileId = checkData.data[0].id;

      // Check if profile is already in the list
      const listCheckResponse = await fetch(
        `https://a.klaviyo.com/api/lists/${listId}/relationships/profiles/`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
            'revision': '2024-10-15',
            'Content-Type': 'application/json',
          },
        }
      );

      const listCheckData = await listCheckResponse.json();
      const isInList = listCheckData.data?.some((profile: any) => profile.id === profileId);

      if (isInList) {
        return NextResponse.json({ alreadySubscribed: true }, { status: 200 });
      }
    }

    // Create or update profile and subscribe to list
    const subscribeResponse = await fetch(
      `https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
          'revision': '2024-10-15',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            type: 'profile-subscription-bulk-create-job',
            attributes: {
              profiles: {
                data: [
                  {
                    type: 'profile',
                    attributes: {
                      phone_number: formattedPhone,
                      subscriptions: {
                        sms: {
                          marketing: {
                            consent: 'SUBSCRIBED'
                          }
                        }
                      }
                    }
                  }
                ]
              }
            },
            relationships: {
              list: {
                data: {
                  type: 'list',
                  id: listId
                }
              }
            }
          }
        }),
      }
    );

    if (!subscribeResponse.ok) {
      const errorText = await subscribeResponse.text();
      console.error('Klaviyo error:', subscribeResponse.status, errorText);
      return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
    }

    console.log('Guitar Hero registration - Klaviyo response status:', subscribeResponse.status);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error registering:', error);
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
  }
}
