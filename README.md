# What?
A microservice.

That can hash passwords.

Pwhaas is a service that lets the good guys hash passwords with the same powerful hardware
used by attackers. This makes the attacker's job 100's of times harder as it increases the
amount of time they have to spend guessing the passwords.

This service offloads CPU intensive password hashing from your application servers so they
can do what they are good at and asynchronously wait on IO instead.

It hashes passwords with the latest recommended salt generating and memory-hard
algorithm optimized for x86 ([Argon2](https://github.com/P-H-C/phc-winner-argon2)).
It is designed to hash in parallel on high CPU count systems with up to 4GB of memory
utilized in order to make the resulting hashes difficult to crack with GPUs or ASIC
processors.

Use me at https://www.pwhaas.com and get acccess to some big iron if you don't
want to host this yourself.

## Why?
Typically we (as in software developers) run VM instances for general purpose web
application servers that happen to also do password hashing. I've never used the
largest systems available just for password hashing. Have you?

Have you been paying attention to the news lately? Sites are hacked. Databases are stolen.
Passwords are released.

Experienced software engineers these days know they cannot store plain text passwords, so
they use a one-way hash on the passwords. However, attackers don't just give up. When
a new hack takes place, attackers get right to work utilizing GPU's and huge multi-core
systems to try to crack those passwords.

We (software engineers) should all be hashing passwords with the highest levels of
security possible while still maintaining a great user experience. We owe it to our users.

Do you run massively parallel, high memory systems dedicated to hashing passwords? No?
Attackers that crack passwords sure do. And now you can, or you can use the ones we host.

## How?
Pwhaas will automatically use as much of the available CPU and RAM on a system as it can.
In the API you can specify how many milliseconds of compute time you want to use. The first
time pwhaas starts up on a system it runs [argon2themax](https://github.com/jdconley/argon2themax)
to determine how long it takes to run Argon2i various memory and iteration
settings, while maxing out the CPU cores. The test algorithm favors using more memory
over more iterations in order to fill a given amount of time but also always does at
least 3 iterations. If the timings are well known, or you want to use different settings,
you should put this file in place before the service starts. The HTTP server will not start
listening until the test is complete.

The argon2 algorithm is limited to 4GB RAM and, practically speaking, memory bandwidth
of current systems limits things even further, so having more memory available than that
will not be useful. For instance, if you have a 32 core server with 256GB of RAM and start
up pwhaas, you'll have 252GB (minus overhead) of extra memory that you don't ever need
and will not be utilized. However, pwhaas will always dedicate all CPU cores to the cause.

Pwhaas also serializes requests and only hashes one password at a time per process. 
Argon2 supports up to 16,777,216 threads, so, you can throw as many CPU's as you want 
at it. However, memory bandwidth is almost always the bottleneck.

## Usage
Pwhaas utilizes JSON for both requests and responses. This is for future expansion of the
API and ease of consumption.

### Hash some data 
A 32 byte salt will be generated and `The password I want to hash!` will be hashed with
Argon2i, utilizing up to 1,000ms of hash compute time.

```sh

curl -X POST -H "Content-Type: application/json" -u "[Your API Key Here]:" -d '{"maxtime":1000, "plain":"The password I want to hash!"}' https://api.pwhaas.com/hash

```

In response you will receive a JSON document with either an error or the hash accompanied
by some additional metadata.

The "options" node contains the options that were sent to the 
[node-argon2](https://github.com/ranisalt/node-argon2/) hash function.

The "hash" node contains the hashed data. Store this and use it in the call to `verify` later.

The "timing" node contains the number of milliseconds pwhaas spent generating salt and
hashing. If you have a paid pwhaas account, these values are used for metering/billing.

The following data was returned in response to an actual call to `hash`.

```json
{
    "hash": "$argon2i$v=19$m=4096,t=3,p=1$k3F2rWWXZ9MSTatHdd8Rgw$04F8gLV5HnwI8DdLDmB+2MPlPsSwkX0ETpVeuJzWX7o",
    "options": {
        "timeCost": 3,
        "memoryCost": 12,
        "parallelism": 1,
        "argon2d": false
    },
    "timing": {
        "salt": 0.084359,
        "hash": 9.15277
    } 
}
```

### Verify a hash
When your users log back in you will need to verify their hashes. Pwhaas can do that for
you. It uses a constant time comparison algorithm to mitigate timing attacks.

```sh

curl -X POST -H "Content-Type: application/json" -u "[Your API Key Here]:" -d '{"hash":"$argon2i$v=19$m=4096,t=3,p=1$k3F2rWWXZ9MSTatHdd8Rgw$04F8gLV5HnwI8DdLDmB+2MPlPsSwkX0ETpVeuJzWX7o", "plain":"The password I want to hash!"}' https://api.pwhaas.com/verify

```

A call to `verify` will return a result JSON object indicating whether the plain and the
hash are a match, as well as the time spent verifying the hash. If you have a paid pwhaas
account, this is used for metering/billing.

```json

{
    "match": true,
    "timing": {
        "verify": 9.596143
    }
}

```

## FAQ
_I don't trust you, why would I send you my users' passwords?_

Fair enough. Then don't! Grab this code and run the service yourself, or hash passwords
locally before you send them so pwhaas ends up just hashing a hash.
Our [pwhaas Node.JS module](https://github.com/jdconley/pwhaas-js) hashes passwords with
a fast configuration of Argon2 locally before sending the password to the pwhaas service.
In production everything is transmitted over SSL.