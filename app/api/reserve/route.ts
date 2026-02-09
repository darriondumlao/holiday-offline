import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, phone, timeSlot, reservationDate } = await request.json();

    if (!email || !phone) {
      return NextResponse.json({ error: 'Email and phone are required' }, { status: 400 });
    }

    if (!timeSlot || !reservationDate) {
      return NextResponse.json({ error: 'Time slot and date are required' }, { status: 400 });
    }

    const klaviyoApiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
    const listId = process.env.KLAVIYO_RESERVATION_LIST_ID;

    if (!klaviyoApiKey || !listId) {
      return NextResponse.json({ error: 'Klaviyo configuration missing' }, { status: 500 });
    }

    // Format phone number to E.164 format (add +1 if not present)
    let formattedPhone = phone.replace(/[^\d+]/g, ''); // Remove all non-digit chars except +
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+1' + formattedPhone; // Assume US number
    }

    // Check if email already exists in the reservation list
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

    // If profile exists, check if they're already in the reservation list
    if (checkData.data && checkData.data.length > 0) {
      const profileId = checkData.data[0].id;

      // Check if profile is already in the reservation list
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
        return NextResponse.json({ alreadyReserved: true }, { status: 200 });
      }
    }

    // Create or update profile and add to reservation list
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
              custom_source: 'Valentines Day 2025 Reservation',
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

    // If subscription succeeded, update the profile with custom properties
    if (subscribeResponse.ok) {
      // Get the profile ID
      const profileResponse = await fetch(
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

      const profileData = await profileResponse.json();
      if (profileData.data && profileData.data.length > 0) {
        const profileId = profileData.data[0].id;

        // Update profile with custom properties
        await fetch(
          `https://a.klaviyo.com/api/profiles/${profileId}/`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
              'revision': '2024-10-15',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              data: {
                type: 'profile',
                id: profileId,
                attributes: {
                  properties: {
                    reservation_time: timeSlot,
                    reservation_date: reservationDate,
                    reservation_source: 'valentines_day_2025',
                    reservation_event: "Valentine's Day Dinner"
                  }
                }
              }
            }),
          }
        );
      }
    }

    if (!subscribeResponse.ok) {
      const errorData = await subscribeResponse.json().catch(() => ({}));
      console.error('Klaviyo subscribe error:', subscribeResponse.status, errorData);
      return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reserve API error:', error);
    return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 });
  }
}
