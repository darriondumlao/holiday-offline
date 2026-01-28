import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, phone } = await request.json();

    if (!email || !phone) {
      return NextResponse.json({ error: 'Email and phone are required' }, { status: 400 });
    }

    const klaviyoApiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
    const listId = process.env.KLAVIYO_LIST_ID;

    if (!klaviyoApiKey || !listId) {
      return NextResponse.json({ error: 'Klaviyo configuration missing' }, { status: 500 });
    }

    // Format phone number to E.164 format (add +1 if not present)
    let formattedPhone = phone.replace(/[^\d+]/g, ''); // Remove all non-digit chars except +
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+1' + formattedPhone; // Assume US number
    }

    // Check if email already exists in the list
    const checkResponse = await fetch(
      `https://a.klaviyo.com/api/profiles/?filter=equals(email,"${email}")`,
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
                      email: email,
                      phone_number: formattedPhone,
                      subscriptions: {
                        email: {
                          marketing: {
                            consent: 'SUBSCRIBED'
                          }
                        },
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
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
